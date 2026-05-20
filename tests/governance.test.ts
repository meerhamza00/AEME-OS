import { describe, it, expect } from 'vitest';

describe('Layer 5: Governance Layer', () => {
    it('Should block unauthorized auto-execution of workflows', () => {
        const evaluateGovernance = (workflow: any, role: string) => {
            if (role !== 'admin' && workflow.riskLevel === 'HIGH') {
                return { allowed: false, reason: 'High risk workflows require admin approval' };
            }
            return { allowed: true };
        };

        const result = evaluateGovernance({ type: 'PPC_BUDGET_ADJUSTMENT', riskLevel: 'HIGH' }, 'analyst');
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('High risk workflows require admin approval');
    });
});
