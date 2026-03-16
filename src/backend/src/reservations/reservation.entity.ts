export class Reservation {
  id: number;
  machineId: number;
  operatorId: number;
  startDate: Date;
  endDate: Date;

  constructor(data: any) {
    Object.assign(this, data);
  }

  async save() {
    return this;
  }
}