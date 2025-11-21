export class PremiumService {
  static async isFeatureAvailable(featureKey: string): Promise<boolean> {
    // Placeholder: return false for non-premium by default
    return false;
  }
}

export default PremiumService;
