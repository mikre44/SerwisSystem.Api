using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Services;

public static class RepairMethodLabels
{
    public static string GetLabel(RepairMethod repairMethod) => repairMethod switch
    {
        RepairMethod.Shipping => "Wysyłka",
        RepairMethod.TechnicianVisit => "Naprawa z dojazdem",
        RepairMethod.OnSite => "Naprawa na miejscu",
        _ => "Nieznany sposób realizacji"
    };
}
