"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const User_1 = require("@/models/User");
const BaseRepository_1 = require("@/repositories/BaseRepository");
class UserRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(User_1.User);
    }
    async findByEmail(email) {
        return this.model.findOne({ email }).exec();
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository.js.map