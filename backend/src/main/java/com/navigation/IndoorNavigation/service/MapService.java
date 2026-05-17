package com.navigation.IndoorNavigation.service;

import com.navigation.IndoorNavigation.model.Cell;
import com.navigation.IndoorNavigation.repository.CellRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MapService {

    @Autowired
    private CellRepository cellRepository;

    public List<Cell> getMapByFloor(Integer floor) {
        return cellRepository.findByFloor(floor);
    }
}