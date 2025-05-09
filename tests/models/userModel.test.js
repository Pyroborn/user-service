const fs = require('fs-extra');
const path = require('path');
const { getAllUsers, getUserById, createUser } = require('../../models/userModel');

// Mock fs-extra
jest.mock('fs-extra');

describe('User Model Tests', () => {
    const mockUsers = {
        users: [
            {
                id: 'user_1',
                name: 'Test User',
                role: 'user',
                createdAt: '2024-01-01T00:00:00.000Z'
            }
        ]
    };

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        // Setup default mock implementations
        fs.pathExists.mockResolvedValue(true);
        fs.readJSON.mockResolvedValue(mockUsers);
        fs.writeJSON.mockResolvedValue();
    });

    describe('getAllUsers', () => {
        it('should return all users', async () => {
            const users = await getAllUsers();
            expect(users).toEqual(mockUsers.users);
            expect(fs.readJSON).toHaveBeenCalled();
        });

        it('should create users file if it does not exist', async () => {
            fs.pathExists.mockResolvedValueOnce(false);
            
            await getAllUsers();
            
            expect(fs.writeJSON).toHaveBeenCalledWith(
                expect.any(String),
                { users: [] }
            );
            expect(fs.readJSON).toHaveBeenCalled();
        });

        it('should handle empty users array', async () => {
            fs.readJSON.mockResolvedValueOnce({ users: [] });
            
            const users = await getAllUsers();
            
            expect(users).toEqual([]);
        });
    });

    describe('getUserById', () => {
        it('should return user by ID', async () => {
            const user = await getUserById('user_1');
            expect(user).toEqual(mockUsers.users[0]);
        });

        it('should return null for non-existent user', async () => {
            const user = await getUserById('non_existent');
            expect(user).toBeNull();
        });
    });

    describe('createUser', () => {
        const newUserData = {
            name: 'New User',
            role: 'admin'
        };

        it('should create a new user with generated ID', async () => {
            const createdUser = await createUser(newUserData);
            
            expect(createdUser.id).toMatch(/^user_\d+$/);
            expect(createdUser.name).toBe(newUserData.name);
            expect(createdUser.role).toBe(newUserData.role);
            expect(createdUser.createdAt).toBeDefined();
            
            expect(fs.writeJSON).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    users: expect.arrayContaining([
                        expect.objectContaining(newUserData)
                    ])
                }),
                { spaces: 2 }
            );
        });

        it('should create a user with provided ID', async () => {
            const userWithId = { ...newUserData, id: 'custom_id' };
            const createdUser = await createUser(userWithId);
            
            expect(createdUser.id).toBe('custom_id');
        });

        it('should throw error if user with ID already exists', async () => {
            const existingUser = { ...newUserData, id: 'user_1' };
            
            await expect(createUser(existingUser))
                .rejects
                .toThrow('User with ID user_1 already exists');
        });

        it('should throw error if name is not provided', async () => {
            const invalidUser = { role: 'user' };
            
            await expect(createUser(invalidUser))
                .rejects
                .toThrow('User name is required');
        });

        it('should set default role if not provided', async () => {
            const userWithoutRole = { name: 'No Role User' };
            const createdUser = await createUser(userWithoutRole);
            
            expect(createdUser.role).toBe('user');
        });

        it('should handle file system errors', async () => {
            // Mock readJSON to return empty users array to pass the existence check
            fs.readJSON.mockResolvedValueOnce({ users: [] });
            // Mock writeJSON to throw an error
            fs.writeJSON.mockRejectedValueOnce(new Error('File system error'));
            
            await expect(createUser(newUserData))
                .rejects
                .toThrow('File system error');
        });
    });
}); 