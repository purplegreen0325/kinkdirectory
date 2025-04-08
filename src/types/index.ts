export type KinkChoice = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = Not Entered, 1 = Favorite, 2 = Like, 3 = Indifferent, 4 = Maybe, 5 = Limit

// User roles
export type UserRole = 'sub' | 'dom' | 'both';

// Format types for kinks
export type KinkFormat = 'general' | 'role_specific';

// Position perspective types
export type KinkPerspective = 'self' | 'partner';

// Available positions
export type KinkPosition = 'as_dom' | 'as_sub' | 'for_dom' | 'for_sub' | 'general';

// Combination of role and perspective
export interface RolePerspective {
  role: UserRole;    // Which user role this applies to
  perspective: KinkPerspective; // Whether this is for self or partner
}

// Kink definition with formats
export interface KinkDefinition {
  id: string;
  key: number;
  format: KinkFormat;
  // For role_specific kinks, defines allowed combinations of roles and perspectives
  // Example: 
  // [{ role: 'dom', perspective: 'self' }, { role: 'dom', perspective: 'partner' }]
  // means dominants can answer for themselves and for their partner
  allowedPerspectives?: RolePerspective[];
}

export interface KinkCategory {
  id: string;
  kinks: KinkDefinition[];
}

export interface KinkList {
  id: string;
  name: string;
  role: UserRole;
  created: number; // timestamp
  selections: Record<string, KinkChoice>; // Format: "categoryId_kinkId_position" -> choice
} 