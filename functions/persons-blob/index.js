const sql = require('mssql')
const crypto = require("crypto")
const { v4: uuidv4 } = require('uuid');

const AZURE_SQL_CONNECTION_STRING = process.env["AZURE_SQL_CONNECTION_STRING"];

module.exports = async function (context, req) {
    const pool = await sql.connect(AZURE_SQL_CONNECTION_STRING);
    pool.config.parseJSON = true;

    /* Defaults to 400 */
    context.res = { status: 400, body: 'The server could not understand the request due to invalid method or parameters.' }  // BadRequest 
    const method = req.method.toLowerCase();
    if (method === "get" && req.params.id) {
        // [GET] ../api/persons-blob/{id:int}/{fid:guid?}

        if (req.params.fid) {
            let result = await pool.request()
                .input('id', sql.Int, req.params.id)
                .input('fid', sql.UniqueIdentifier, req.params.fid)
                .query('SELECT fid FROM [dbo].[Person] ' +
                    ' CROSS APPLY OPENJSON (Attachments, N\'$\') WITH (fid UNIQUEIDENTIFIER \'$\') ' +
                    ' WHERE PersonId = @id AND [fid] = @fid ')
            if (result.recordset.length === 1) {
                result = await pool.request()
                    .input('fid', sql.UniqueIdentifier, req.params.fid)
                    .query('SELECT * FROM AttachmentFiles WHERE fid = @fid')
                const bytes = result.recordset[0]['bytes']
                const filename = result.recordset[0]['filename']
                context.res = {
                    status: 200,
                    body: Buffer.from(bytes),
                    headers: { "Content-Disposition": `attachment; filename=${filename}` }
                }
            }
            else context.res = { status: 401, body: 'Unauthorized' }
        } else {
            let result = await pool.request()
                .input('id', sql.Int, req.params.id)
                .query('SELECT AttachmentFiles.fid, [filename], [size] FROM AttachmentFiles INNER JOIN (' +
                    " SELECT fid FROM [dbo].[Person] CROSS APPLY OPENJSON (Attachments, N'$') WITH (fid UNIQUEIDENTIFIER '$')" +
                    ' WHERE PersonId = @ID) AS T ON T.fid = AttachmentFiles.fid')
            context.res = { body: result.recordset }
        }
    } else if (req.body && method === "post" && req.params.id) {
        // [POST] ../api/persons-blob/{id:int}

        const fid = uuidv4()
        const bytes = req.rawBody
        const filename = /filename=\"(.*)\"/gi.exec(req.headers['content-disposition'])[1]
        const sha256 = crypto.createHash('sha256').update(bytes).digest('hex')
        await pool.request()
            .input('fid', sql.UniqueIdentifier, fid)
            .input('filename', sql.NVarChar, filename)
            .input('size', sql.Int, bytes.length)
            .input('hashSHA256', sql.NVarChar, sha256)
            .input('bytes', sql.VarBinary, Buffer.from(bytes))
            .query("INSERT INTO AttachmentFiles ([fid], [filename], [size], [hashSHA256], [bytes]) VALUES (@fid, @filename, @size, @hashSHA256, @bytes)")
        await pool.request()
            .input('fid', fid)
            .input('ID', sql.Int, req.params.id)
            .query("UPDATE Person SET Attachments = JSON_MODIFY(ISNULL(Attachments, '[]'), 'append $', @fid), " +
                " LastUpdate = CURRENT_TIMESTAMP WHERE PersonId = @ID")
        context.res = { status: 200 }   // OK
    }
    pool.close();
    context.done();

}