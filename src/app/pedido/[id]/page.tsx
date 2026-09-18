import { OrderConfirmationView } from "elestampadero/views/order-confirmation";

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { id } = await params;
  return <OrderConfirmationView orderId={id} />;
}
