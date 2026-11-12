package com.example.taskmanager.repository;

import com.example.taskmanager.model.Task;
import com.example.taskmanager.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByOwnerIdOrderByDueDateAscIdDesc(Long ownerId);
    List<Task> findByOwnerIdAndStatusOrderByDueDateAscIdDesc(Long ownerId, TaskStatus status);
    Optional<Task> findByIdAndOwnerId(Long id, Long ownerId);
}
