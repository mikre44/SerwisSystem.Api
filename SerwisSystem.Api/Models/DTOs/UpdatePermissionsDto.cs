using System.ComponentModel.DataAnnotations;
﻿namespace SerwisSystem.Api.Models.DTOs;

public class UpdatePermissionsDto
{
    [Required(ErrorMessage = "To pole jest wymagane.")]
    public List<string> PermissionsGranted { get; set; } = new();

    [Required(ErrorMessage = "To pole jest wymagane.")]
    public List<string> PermissionsRevoked { get; set; } = new();
}