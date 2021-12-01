-- No Pagination
SELECT * FROM Person ORDER BY LastName, FirstName
GO

-- Pagination by Page Number
DECLARE 
  @PageNumber int = 52,
  @RowsPerPage int = 10;
  
SELECT * FROM Person ORDER BY LastName, FirstName
    OFFSET (@PageNumber - 1) * @RowsPerPage ROWS
    FETCH NEXT @RowsPerPage ROWS ONLY
GO


-- No Pagination (with WHERE)
SELECT * FROM Person WHERE YEAR(DateOfBirth) >= 1980 ORDER BY LastName, FirstName
GO


-- Pagination by Page Number (with WHERE and COUNT(*) OVER)
DECLARE 
  @PageNumber int = 2,
  @RowsPerPage int = 10;
  
SELECT Person.*, overall_count = COUNT(1) OVER()
FROM Person
WHERE YEAR(DateOfBirth) >= 1980
ORDER BY LastName, FirstName
    OFFSET (@PageNumber - 1) * @RowsPerPage ROWS
    FETCH NEXT @RowsPerPage ROWS ONLY
GO


-- COUNT(*) (with WHERE)
SELECT COUNT(*) FROM Person WHERE YEAR(DateOfBirth) >= 1980
GO

