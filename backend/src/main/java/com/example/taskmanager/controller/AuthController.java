package com.example.taskmanager.controller;

import com.example.taskmanager.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public record RegisterRequest(
            @NotBlank(message = "Name is required.")
            @Size(max = 100, message = "Name must be 100 characters or fewer.") String name,
            @NotBlank(message = "Email is required.")
            @Email(message = "Enter a valid email address.")
            @Size(max = 190) String email,
            @NotBlank(message = "Password is required.")
            @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters.")
            String password
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required.") @Email String email,
            @NotBlank(message = "Password is required.") String password
    ) {}

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request.name(), request.email(), request.password());
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.email(), request.password());
    }
}
