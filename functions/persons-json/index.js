const sql = require('mssql')
const AZURE_SQL_CONNECTION_STRING = process.env["AZURE_SQL_CONNECTION_STRING"];

module.exports = async function (context, req) {
    const pool = await sql.connect(AZURE_SQL_CONNECTION_STRING);
    pool.config.parseJSON = true;

    /* Defaults to 400 */
    context.res = { status: 400, body: 'The server could not understand the request due to invalid method or parameters.' }  // BadRequest 
    const method = req.method.toLowerCase();
    if (method === "get" && req.params.id) {
        // [GET] ../api/persons-json/{id:int}
        let mode = "value"; // path | parse | value 

        if (mode === "path") {
            let persons = await pool.request()
                .input('ID', sql.Int, req.params.id)
                .query("SELECT *, JSON_QUERY(JsonColumn) AS 'other' FROM Person WHERE PersonId = @ID FOR JSON PATH, WITHOUT_ARRAY_WRAPPER")
            // WITHOUT_ARRAY_WRAPPER option: you can use this option if you know that you are returning a single object as a result of query.
            context.res = { body: persons.recordset[0] }
        } else if (mode === "value") {
            let persons = await pool.request()
                .input('ID', sql.Int, req.params.id)
                .query("SELECT PersonId, FirstName, LastName, DateOfBirth," +
                    " JSON_VALUE(JsonColumn, '$.gender') AS Gender, JSON_VALUE(JsonColumn, '$.addresses[0].city') AS City " +
                    " FROM Person WHERE PersonId = @ID")
            context.res = { body: persons.recordset[0] }
        } else if (mode === "parse") {
            let persons = await pool.request()
                .input('ID', sql.Int, req.params.id)
                .query("SELECT * FROM Person WHERE PersonId = @ID")
            let record = persons.recordset[0]
            let informations = JSON.parse(record.JsonColumn)
            let result = {
                FirstName: record.FirstName,
                LastName: record.LastName,
                Gender: informations.gender,
                MoreInformations: informations
            }
            context.res = { body: result }
        }
    } else if (req.body && method === "post" && req.params.id) {
        // [POST] ../api/persons-json/{id:int}
        let mode = "full"; // modify | full
        let person = JSON.parse(req.rawBody) // convert & validate input
        if (mode === "modify") {
            let response = await pool.request()
                .input('FirstName', person.firstName)
                .input('LastName', person.lastName)
                .input('Gender', person.gender)
                .input('ID', sql.Int, req.params.id)
                .query("UPDATE Person SET FirstName = @FirstName, LastName = @LastName, JsonColumn = JSON_MODIFY(ISNULL(JsonColumn, '{}'), '$.gender', @Gender), " +
                    " LastUpdate = CURRENT_TIMESTAMP WHERE PersonId = @ID")
        } else if (mode === "full") {
            let response = await pool.request()
                .input('JsonColumn', JSON.stringify(person))
                .input('ID', sql.Int, req.params.id)
                .query("UPDATE Person SET JsonColumn = @JsonColumn, LastUpdate = CURRENT_TIMESTAMP WHERE PersonId = @ID")
        }
        context.res = { status: 200 }   // OK
    }
    pool.close();
    context.done();

}