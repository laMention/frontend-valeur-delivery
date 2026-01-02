export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^(\+225|225|0)?[0-9]{10}$/;
  return re.test(phone.replace(/\s/g, ''));
};

export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const validateMinLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * Détecte si une valeur est un email ou un numéro de téléphone
 * @param value - La valeur à analyser
 * @returns 'email' | 'phone' | null
 */
export const detectIdentifierType = (value: string): 'email' | 'phone' | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  // D'abord vérifier si c'est un email
  if (validateEmail(trimmedValue)) {
    return 'email';
  }

  // Ensuite vérifier si c'est un téléphone
  // Format plus flexible pour accepter les formats internationaux
  const phoneRegex = /^(\+?[0-9]{1,4}[\s-]?)?([0-9][\s-]?){8,15}$/;
  const cleanedPhone = trimmedValue.replace(/[\s-]/g, '');
  
  if (phoneRegex.test(cleanedPhone) && cleanedPhone.length >= 8 && cleanedPhone.length <= 15) {
    return 'phone';
  }

  return null;
};

/**
 * Valide un identifiant (email ou téléphone)
 * @param value - La valeur à valider
 * @returns true si valide, false sinon
 */
export const validateIdentifier = (value: string): boolean => {
  return detectIdentifierType(value) !== null;
};

