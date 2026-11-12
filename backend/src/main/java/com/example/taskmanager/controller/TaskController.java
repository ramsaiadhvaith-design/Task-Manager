package com.example.taskmanager.controller;

import com.example.taskmanager.model.Task;
import com.example.taskmanager.model.TaskStatus;
import com.example.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    public java.util.List<Task> getTasks(Authentication authentication,
                                         @RequestParam(required = false) String status) {
        return service.getTasks(authentication.getName(), status);
    }

    @GetMapping("/{id}")
    public Task getTask(Authentication authentication, @PathVariable Long id) {
        return service.getTask(authentication.getName(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Task createTask(Authentication authentication, @Valid @RequestBody Task task) {
        return service.createTask(authentication.getName(), task);
    }

    @PutMapping("/{id}")
    public Task updateTask(Authentication authentication, @PathVariable Long id,
                           @Valid @RequestBody Task task) {
        return service.updateTask(authentication.getName(), id, task);
    }

    @PatchMapping("/{id}/status")
    public Task updateStatus(Authentication authentication, @PathVariable Long id,
                             @RequestBody Map<String, String> body) {
        String value = body.get("status");
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required.");
        }
        try {
            return service.updateStatus(authentication.getName(), id,
                    TaskStatus.valueOf(value.trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be PENDING or COMPLETED.");
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(Authentication authentication, @PathVariable Long id) {
        service.deleteTask(authentication.getName(), id);
    }
}
