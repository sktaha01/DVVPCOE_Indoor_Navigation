package com.navigation.IndoorNavigation.controller;

import com.navigation.IndoorNavigation.model.Cell;
import com.navigation.IndoorNavigation.service.MapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maps")
@CrossOrigin(origins = "*")
public class MapController {

    @Autowired
    private MapService mapService;

    @GetMapping("/{floor}")
    public List<Cell> getMapByFloor(@PathVariable Integer floor) {
        return mapService.getMapByFloor(floor);
    }
}