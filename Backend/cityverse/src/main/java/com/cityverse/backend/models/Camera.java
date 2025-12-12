package com.cityverse.backend.models;

import java.util.List;

// Model representing a camera's position, orientation, and height in the 3D world
public class Camera {
    private String id;
    private List<Double> position;   // [x, y, z]
    private double heading;          // Turning left/right
    private double pitch;            // Left and right tilt
    private double roll;             // Front and back tilt
    private double height;           // camera elevation from ground

    public Camera() {}

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public List<Double> getPosition() { return position; }
    public void setPosition(List<Double> position) { this.position = position; }

    public double getHeading() { return heading; }
    public void setHeading(double heading) { this.heading = heading; }

    public double getPitch() { return pitch; }
    public void setPitch(double pitch) { this.pitch = pitch; }

    public double getRoll() { return roll; }
    public void setRoll(double roll) { this.roll = roll; }

    public double getHeight() { return height; }
    public void setHeight(double height) { this.height = height; }
}
