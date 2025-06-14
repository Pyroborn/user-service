const UserModel = require('../../models/userModel');
const { getUsers, getUserById, createUser, validateUser } = require('../../controllers/userController');

// Mock UserModel
jest.mock('../../models/userModel');

describe('User Controller Tests', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup request and response objects
        req = {
            params: {},
            body: {},
            header: jest.fn()
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('getUsers', () => {
        it('should return all users', async () => {
            const mockUsers = [
                { id: 'user1', name: 'Test User 1' },
                { id: 'user2', name: 'Test User 2' }
            ];
            UserModel.getAllUsers.mockResolvedValue(mockUsers);

            await getUsers(req, res, next);

            expect(res.json).toHaveBeenCalledWith(mockUsers);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            UserModel.getAllUsers.mockRejectedValue(error);

            await getUsers(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe('getUserById', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 'user1', name: 'Test User' };
            UserModel.getUserById.mockResolvedValue(mockUser);
            req.params.id = 'user1';

            await getUserById(req, res, next);

            expect(res.json).toHaveBeenCalledWith(mockUser);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 404 when user not found', async () => {
            UserModel.getUserById.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await getUserById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            UserModel.getUserById.mockRejectedValue(error);
            req.params.id = 'user1';

            await getUserById(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe('createUser', () => {
        const userData = { name: 'New User', role: 'user' };

        it('should create and return new user', async () => {
            const createdUser = { ...userData, id: 'new_user_1' };
            UserModel.createUser.mockResolvedValue(createdUser);
            req.body = userData;

            await createUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(createdUser);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 400 when user already exists', async () => {
            const error = new Error('User with ID test_id already exists');
            UserModel.createUser.mockRejectedValue(error);
            req.body = { ...userData, id: 'test_id' };

            await createUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: error.message });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 400 when required fields are missing', async () => {
            const error = new Error('User name is required');
            UserModel.createUser.mockRejectedValue(error);
            req.body = { role: 'user' };

            await createUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: error.message });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle unexpected errors', async () => {
            const error = new Error('Database error');
            UserModel.createUser.mockRejectedValue(error);
            req.body = userData;

            await createUser(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe('validateUser', () => {
        it('should validate existing user', async () => {
            const mockUser = { id: 'user1', name: 'Test User' };
            UserModel.getUserById.mockResolvedValue(mockUser);
            req.header.mockReturnValue('user1');

            await validateUser(req, res, next);

            expect(res.json).toHaveBeenCalledWith({ valid: true, user: mockUser });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 400 when X-User-Id header is missing', async () => {
            req.header.mockReturnValue(null);

            await validateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'X-User-Id header is required' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 404 when user not found', async () => {
            UserModel.getUserById.mockResolvedValue(null);
            req.header.mockReturnValue('nonexistent');

            await validateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            UserModel.getUserById.mockRejectedValue(error);
            req.header.mockReturnValue('user1');

            await validateUser(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.json).not.toHaveBeenCalled();
        });
    });
}); 