IF OBJECT_ID('dbo.Person') IS NULL BEGIN
    CREATE TABLE [Person]
    (
        PersonId INT IDENTITY PRIMARY KEY,
        FirstName VARCHAR(128) NOT NULL,
        LastName VARCHAR(128) NOT NULL,
        DateOfBirth DATE NOT NULL,
        Email VARCHAR(128) NULL,
        JsonColumn NVARCHAR(MAX) NULL CHECK (ISJSON(JsonColumn)  = 1),
        Attachments NVARCHAR(MAX) NULL CHECK (ISJSON(Attachments)  = 1),
        LastUpdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
END
GO

IF OBJECT_ID('dbo.AttachmentFiles') IS NULL BEGIN
    CREATE TABLE [AttachmentFiles]
    (
        [fid] UNIQUEIDENTIFIER PRIMARY KEY,
        [filename] VARCHAR(512) NOT NULL,
        [size] INT NOT NULL,
        [hashSHA256] VARCHAR(64) NOT NULL,
        [bytes] VARBINARY(MAX) NOT NULL,
        [lastUpdate] DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    )
END
GO