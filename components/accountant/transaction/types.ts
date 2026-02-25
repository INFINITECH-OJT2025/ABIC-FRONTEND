export type TransactionType =
  | "CHEQUE"
  | "DEPOSIT SLIP"
  | "CASH DEPOSIT"
  | "CHEQUE DEPOSIT"
  | "BANK TRANSFER";

export type Owner = {
  id: number;
  name: string;
  owner_type: string;
  status: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type Unit = {
  id: number;
  unit_name: string;
  owner_id: number | null;
  property_id: number | null;
  status: string;
  notes?: string | null;
};

export type Property = {
  id: number;
  name: string;
  property_type: string;
  address?: string | null;
  status: string;
};

export type TransactionFormData = {
  voucher_date: string;
  voucher_no: string;
  transaction_type: TransactionType;
  instrument_type: string;
  instrument_no: string;
  fund_reference: string;
  person_in_charge: string;
  from_owner_id: number | null;
  to_owner_id: number | null;
  unit_id: number | null;
  unit_name: string;
  particulars: string;
  amount: string;
};

export type FieldErrors = {
  from_owner_id?: string;
  to_owner_id?: string;
  amount?: string;
  particulars?: string;
  voucher_date?: string;
  voucher_no?: string;
};

export type SuccessTransactionData = {
  voucherMode: "WITH_VOUCHER" | "NO_VOUCHER";
  voucher_date?: string;
  voucher_no?: string;
  transaction_type: string;
  instrument_no?: string;
  instrumentNumbers?: string[];
  fromOwnerName: string;
  toOwnerName: string;
  unit_name?: string;
  particulars?: string;
  fund_reference?: string;
  person_in_charge?: string;
  attachmentsCount: number;
  amount: string;
};
