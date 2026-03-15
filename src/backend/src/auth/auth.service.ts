import { Injectable } from 'nestjs';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    private readonly saltRounds = 10;
    private readonly jwtSecret = 'your_jwt_secret'; // Use a secure and secret value in production

    public async register(username: string, password: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(password, this.saltRounds);
        // Here, save the user (username and hashedPassword) to your database
        console.log(`Registering user: ${username} with password: ${hashedPassword}`);
    }

    public async login(username: string, password: string): Promise<string> {
        // Retrieve the user from your database by username
        // Assuming you have a function `findUserByUsername`
        const user = await this.findUserByUsername(username);
        if (!user) throw new Error('User not found');

        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isPasswordValid) throw new Error('Invalid password');

        // Generate JWT Token
        const token = jwt.sign({ username }, this.jwtSecret, { expiresIn: '1h' });
        return token;
    }

    private async findUserByUsername(username: string): Promise<any> {
        // Implement your user database retrieval logic here
        return null; // Placeholder
    }
}