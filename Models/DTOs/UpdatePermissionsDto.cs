public class UpdatePermissionsDto
{
    public List<string> PermissionsGranted { get; set; } = new();

    public List<string> PermissionsRevoked { get; set; } = new();
}