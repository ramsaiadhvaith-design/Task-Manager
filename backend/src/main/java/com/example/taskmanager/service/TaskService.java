package com.example.taskmanager.service;

import com.example.taskmanager.model.AppUser;
import com.example.taskmanager.model.Task;
import com.example.taskmanager.model.TaskStatus;
import com.example.taskmanager.repository.AppUserRepository;
import com.example.taskmanager.repository.TaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class TaskService {
    private final TaskRepository tasks;
    private final AppUserRepository users;

    public TaskService(TaskRepository tasks, AppUserRepository users) {
        this.tasks = tasks;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<Task> getTasks(String email, String status) {
        Long ownerId = getUser(email).getId();
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            return tasks.findByOwnerIdOrderByDueDateAscIdDesc(ownerId);
        }
        try {
            return tasks.findByOwnerIdAndStatusOrderByDueDateAscIdDesc(
                    ownerId, TaskStatus.valueOf(status.trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be ALL, PENDING, or COMPLETED.");
        }
    }

    @Transactional(readOnly = true)
    public Task getTask(String email, Long id) {
        return findOwnedTask(email, id);
    }

    public Task createTask(String email, Task incoming) {
        AppUser owner = getUser(email);
        Task task = new Task();
        task.setTitle(incoming.getTitle().trim());
        task.setDescription(incoming.getDescription());
        task.setDueDate(incoming.getDueDate());
        task.setStatus(TaskStatus.PENDING);
        task.setOwner(owner);
        return tasks.save(task);
    }

    public Task updateTask(String email, Long id, Task incoming) {
        Task task = findOwnedTask(email, id);
        task.setTitle(incoming.getTitle().trim());
        task.setDescription(incoming.getDescription());
        task.setDueDate(incoming.getDueDate());
        return tasks.save(task);
    }

    public Task updateStatus(String email, Long id, TaskStatus status) {
        Task task = findOwnedTask(email, id);
        task.setStatus(status);
        return tasks.save(task);
    }

    public void deleteTask(String email, Long id) {
        tasks.delete(findOwnedTask(email, id));
    }

    private AppUser getUser(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found."));
    }

    private Task findOwnedTask(String email, Long id) {
        return tasks.findByIdAndOwnerId(id, getUser(email).getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found."));
    }
}
