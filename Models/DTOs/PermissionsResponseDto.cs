public class PermissionsResponseDto
{
    public bool ReadRepairs { get; set; }
    public bool TakeRepairs { get; set; }
    public bool EditRepairs { get; set; }
    public bool DeleteRepairs { get; set; }

    public bool ReadUsers { get; set; }
    public bool EditUsers { get; set; }
    public bool DeleteUsers { get; set; }
    public bool GrantUsers { get; set; }
    public bool DischargeUsers { get; set; }
}