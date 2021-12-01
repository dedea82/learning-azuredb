const sql = require('mssql')
const AZURE_SQL_CONNECTION_STRING = process.env["AZURE_SQL_CONNECTION_STRING"];

module.exports = async function (context, req) {
    const pool = await sql.connect(AZURE_SQL_CONNECTION_STRING);

    const genders = ['F', 'M']
    const namesFemale = ['Sofia', 'Aurora', 'Giulia', 'Emma', 'Giorgia', 'Martina', 'Alice', 'Greta', 'Ginevra', 'Chiara', 'Anna', 'Sara', 'Beatrice', 'Nicole', 'Gaia', 'Matilde', 'Vittoria', 'Noemi', 'Francesca', 'Alessia', 'Ludovica', 'Arianna', 'Viola', 'Camilla', 'Elisa', 'Bianca', 'Giada', 'Rebecca', 'Elena', 'Mia', 'Adele', 'Marta', 'Gioia', 'Maria', 'Asia', 'Eleonora', 'Carlotta', 'Miriam', 'Irene', 'Melissa', 'Margherita', 'Emily', 'Caterina', 'Anita', 'Serena', 'Benedetta', 'Rachele', 'Angelica', 'Cecilia', 'Isabel']
    const namesMale = ['Francesco', 'Alessandro', 'Leonardo', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Matteo', 'Tommaso', 'Riccardo', 'Edoardo', 'Giuseppe', 'Davide', 'Antonio', 'Federico', 'Diego', 'Giovanni', 'Christian', 'Nicolò', 'Samuele', 'Pietro', 'Marco', 'Luca', 'Filippo', 'Simone', 'Alessio', 'Gabriel', 'Michele', 'Emanuele', 'Jacopo', 'Salvatore', 'Giulio', 'Cristian', 'Daniele', 'Vincenzo', 'Giacomo', 'Gioele', 'Manuel', 'Elia', 'Thomas', 'Samuel', 'Giorgio', 'Daniel', 'Enea', 'Stefano', 'Luigi', 'Nicola', 'Domenico', 'Angelo', 'Kevin']
    const surnames = ['ROSSI', 'RUSSO', 'FERRARI', 'ESPOSITO', 'BIANCHI', 'ROMANO', 'COLOMBO', 'RICCI', 'MARINO', 'GRECO', 'BRUNO', 'GALLO', 'CONTI', 'DE LUCA', 'MANCINI', 'COSTA', 'GIORDANO', 'RIZZO', 'LOMBARDI', 'MORETTI', 'BARBIERI', 'FONTANA', 'SANTORO', 'MARIANI', 'RINALDI', 'CARUSO', 'FERRARA', 'GALLI', 'MARTINI', 'LEONE', 'LONGO', 'GENTILE', 'MARTINELLI', 'VITALE', 'LOMBARDO', 'SERRA', 'COPPOLA', 'DE SANTIS', 'D\'ANGELO', 'MARCHETTI', 'PARISI', 'VILLA', 'CONTE', 'FERRARO', 'FERRI', 'FABBRI', 'BIANCO', 'MARINI', 'GRASSO', 'VALENTINI', 'MESSINA', 'SALA', 'DE ANGELIS', 'GATTI', 'PELLEGRINI', 'PALUMBO', 'SANNA', 'FARINA', 'RIZZI', 'MONTI', 'CATTANEO', 'MORELLI', 'AMATO', 'SILVESTRI', 'MAZZA', 'TESTA', 'GRASSI', 'PELLEGRINO', 'CARBONE', 'GIULIANI', 'BENEDETTI', 'BARONE', 'ROSSETTI', 'CAPUTO', 'MONTANARI', 'GUERRA', 'PALMIERI', 'BERNARDI', 'MARTINO', 'FIORE', 'DE ROSA', 'FERRETTI', 'BELLINI', 'BASILE', 'RIVA', 'DONATI', 'PIRAS', 'VITALI', 'BATTAGLIA', 'SARTORI', 'NERI', 'COSTANTINI', 'MILANI', 'PAGANO', 'RUGGIERO', 'SORRENTINO', 'D\'AMICO', 'ORLANDO', 'DAMICO', 'NEGRI', 'FRANCO', 'CASTELLI', 'FERRO', 'VIOLA', 'RUGGERI', 'OLIVIERI', 'ROSA', 'MOLINARI', 'ALBERTI', 'PIAZZA', 'MORO', 'POLI', 'D\'AGOSTINO', 'BASSI', 'VALENTE', 'SPINELLI']
    const domains = ['@gmail.com', '@email.it', '@libero.it', '@me.com', '@icloud.com', '@yahoo.com', '@alice.it']

    /* Defaults to 400 */
    context.res = { status: 400, body: 'The server could not understand the request due to invalid method or parameters.' }  // BadRequest 
    const method = req.method.toLowerCase();
    if (method === "get" && req.params.count) {
        for (let i = 0; i < req.params.count; i += 1) {
            const person = {
                lastName: surnames.randomize(),
                gender: genders.randomize(),
                dateOfBirth: randomDate(new Date(1920, 0, 1), new Date(1982, 0, 1)),
            }
            person.firstName = (person.gender === 'M' ? namesMale : namesFemale).randomize()
            person.fullName = `${person.lastName} ${person.firstName}`
            person.email = person.fullName.toLowerCase().replace(' ', '.') + person.dateOfBirth.getFullYear().toString().substr(-2) + domains.randomize()
            person.dateOfBirth.setUTCHours(0, 0, 0, 0)
            
            await pool.request()
            .input('FirstName', person.firstName)
            .input('LastName', person.lastName)
            .input('DateOfBirth', sql.Date, person.dateOfBirth)
            .input('Email', person.email)
            .query("INSERT INTO Person (FirstName, LastName, DateOfBirth, Email) VALUES (@FirstName, @LastName, @DateOfBirth, @Email)")

        }
        context.res = { status: 200 }   // OK
    }
    pool.close();
    context.done();

}

/* utils */
function randomInt(max) { return Math.floor(Math.random() * max) }
function randomDate(start, end) { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())) }
Array.prototype.randomize = function randomize() { return this[randomInt(this.length)] }
