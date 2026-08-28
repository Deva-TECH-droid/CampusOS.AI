export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
export const isValidCGPA = (cgpa) => cgpa >= 0 && cgpa <= 10
export const isValidYear = (year) => [1, 2, 3, 4].includes(Number(year))
