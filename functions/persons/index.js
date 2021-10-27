const sql = require('mssql')
const AZURE_SQL_CONNECTION_STRING = process.env["AZURE_SQL_CONNECTION_STRING"];

module.exports = async function (context, req) {
    const pool = await sql.connect(AZURE_SQL_CONNECTION_STRING);

    /* Defaults to 400 */
    context.res = { status: 400, body: 'The server could not understand the request due to invalid method or parameters.' }  // BadRequest 
    const method = req.method.toLowerCase();
    if (method === "get" && req.params.id) {
        // [GET] ../api/persons/{id:int}
        let result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Person WHERE PersonId = @id')
        if (result.recordset.length !== 0) {
            context.res = { body: result.recordset[0] }
        } else { context.res = { status: 404, body: 'The requested resource was not found.' }; } // NotFound
    } else if (method === "get") {
        // [GET] ../api/persons
        let persons = await pool.request().query('SELECT * FROM Person')
        context.res = { body: persons.recordset }
    } else if (req.body && ((method === "put") || (method === "post" && req.params.id))) {
        // [PUT] ../api/persons
        // [POST] ../api/persons/{id:int}
        let is_update = (method === "post");
        let person = req.body
        let request = await pool.request()
            .input('FirstName', person.firstName)
            .input('LastName', person.lastName)
            .input('DateOfBirth', sql.Date, person.dateOfBirth)
            .input('Email', person.email)
        let response = null;
        if (is_update) {
            response = await request.input('ID', sql.Int, req.params.id)
                .query("UPDATE Person SET FirstName = @FirstName, LastName = @LastName, DateOfBirth = @DateOfBirth, Email = @Email, " +
                    " LastUpdate = CURRENT_TIMESTAMP WHERE PersonId = @ID")
        }
        else {
            response = await request.query("INSERT INTO Person (FirstName, LastName, DateOfBirth, Email) VALUES (@FirstName, @LastName, @DateOfBirth, @Email)")
        }
        context.res = { status: (is_update ? 200 : 201) }   // OK or Created
    }
    pool.close();
    context.done();

}