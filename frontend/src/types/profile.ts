export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}
