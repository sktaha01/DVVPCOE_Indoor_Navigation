package com.navigation.IndoorNavigation.repository;

import com.navigation.IndoorNavigation.model.Cell;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CellRepository extends JpaRepository<Cell, Integer> {

    List<Cell> findByFloor(Integer floor);
}