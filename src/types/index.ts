type UserData = {
  email: string;
  username: string;
};

export type PasswordsData = {
  _id?: string;
  createdAt: string;
  user: UserData;
  website: string;
  name?: string;
  username: string;
  password: string;
  note?: string;
  isFavorite?: boolean;
  tags?: string[];
};

export type CardsData = {
  _id?: string;
  createdAt: string;
  user: UserData;
  name: string;
  serviceName?: string;
  cardType?: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  note?: string;
  website?: string;
  isFavorite?: boolean;
  tags?: string[];
};

export type NotesData = {
  _id?: string;
  createdAt: string;
  user: UserData;
  title: string;
  content: string;
  isFavorite?: boolean;
  tags?: string[];
};
