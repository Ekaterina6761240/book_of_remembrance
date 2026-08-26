import { MockAuthService } from '../../mocks/services/MockAuthService';
import type { AuthService } from '../../services';

// Replace only this factory when WordPress cookie/nonce authentication is available.
export const createAuthService = (): AuthService => new MockAuthService();
