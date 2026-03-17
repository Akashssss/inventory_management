import { User, IUser } from "@/models/User";
import { BaseRepository } from "@/repositories/BaseRepository";

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }
}
