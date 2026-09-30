namespace SerwisSystem.Api.Models.Enums;

// One member per bool column on Permissions. Using this enum instead of raw strings means a typo
// in a permission name is a compile error, not a silent 403 at runtime.
public enum Permission
{
    ReadRepairs,
    TakeRepairs,
    EditRepairs,
    DeleteRepairs,

    ReadUsers,
    EditUsers,
    DeleteUsers,
    GrantUsers,
    DischargeUsers
}
