import { Injectable } from '@nestjs/common';
import { Machine } from './machine.entity';

@Injectable()
export class MachinesService {
    private machines: Machine[] = [];

    constructor() {
        // Initialize with some dummy data for illustration
        this.machines.push(new Machine(1, 'Excavator', 'Available', { latitude: 40.7128, longitude: -74.0060 }));
        this.machines.push(new Machine(2, 'Bulldozer', 'In Use', { latitude: 34.0522, longitude: -118.2437 }));
    }

    // Method to add a new machine
    addMachine(name: string, status: string, location: { latitude: number, longitude: number }): Machine {
        const newMachine = new Machine(this.machines.length + 1, name, status, location);
        this.machines.push(newMachine);
        return newMachine;
    }

    // Method to get all machines
    getAllMachines(): Machine[] {
        return this.machines;
    }

    // Method to update machine status
    updateMachineStatus(id: number, status: string): Machine | undefined {
        const machine = this.machines.find(m => m.id === id);
        if (machine) {
            machine.status = status;
        }
        return machine;
    }

    // Method to validate machine availability
    validateMachineAvailability(id: number): boolean {
        const machine = this.machines.find(m => m.id === id);
        return machine ? machine.status === 'Available' : false;
    }

    // Method to update machine location
    updateMachineLocation(id: number, location: { latitude: number, longitude: number }): Machine | undefined {
        const machine = this.machines.find(m => m.id === id);
        if (machine) {
            machine.location = location;
        }
        return machine;
    }
}

// Example of a Machine entity
export class Machine {
    constructor(public id: number, public name: string, public status: string, public location: { latitude: number; longitude: number }) {}
}