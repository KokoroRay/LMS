import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spin, message } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import api from "../../services/authService";

export default function PaymentCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Lấy tất cả query params từ URL
        const params = Object.fromEntries(searchParams.entries());
        
        // Gọi API callback để xử lý
        const response = await api.get("/payments/callback-reenroll", { params });
        
        // Parse XML response nếu cần
        let status = "success";
        let paymentId = null;
        
        if (response.data) {
          // Nếu là XML string, parse nó
          if (typeof response.data === "string") {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response.data, "text/xml");
            const statusNode = xmlDoc.querySelector("status");
            const paymentIdNode = xmlDoc.querySelector("paymentId");
            
            status = statusNode?.textContent || "success";
            paymentId = paymentIdNode?.textContent || null;
          } else {
            // Nếu là JSON
            status = response.data.status || response.data.data?.status || "success";
            paymentId = response.data.paymentId || response.data.data?.paymentId || null;
          }
        }

        if (status === "success") {
          const vnpAmount = searchParams.get("vnp_Amount");
          const vnpTransactionNo = searchParams.get("vnp_TransactionNo");
          
          // Lấy amount từ nhiều nguồn
          let amount = null;
          
          // 1. Từ vnp_Amount (VNPay trả về, đơn vị là cent)
          if (vnpAmount) {
            amount = parseInt(vnpAmount) / 100;
          }
          // 2. Từ response data nếu có
          else if (response.data) {
            if (typeof response.data === "object" && !Array.isArray(response.data)) {
              const responseAmount = response.data.amount || response.data.data?.amount;
              if (responseAmount) {
                amount = typeof responseAmount === "number" 
                  ? responseAmount 
                  : parseFloat(responseAmount);
              }
            }
          }
          
          console.log("Payment success! Redirecting to /payment/success");
          console.log("Payment info:", { 
            amount, 
            vnpAmount, 
            transactionCode: vnpTransactionNo, 
            paymentId,
            responseData: response.data 
          });
          
          // Redirect về trang success với thông tin thanh toán thành công
          const successParams = new URLSearchParams({
            paymentId: paymentId || "",
          });
          
          if (amount) {
            successParams.set("amount", amount.toString());
          }
          if (vnpTransactionNo) {
            successParams.set("transactionCode", vnpTransactionNo);
          }
          
          navigate(`/payment/success?${successParams.toString()}`, { replace: true });
        } else {
          console.log("Payment failed! Status:", status);
          // Redirect về trang failure với thông tin thanh toán thất bại
          const failureParams = new URLSearchParams({
            error: "Thanh toán thất bại. Vui lòng thử lại.",
          });
          navigate(`/payment/failure?${failureParams.toString()}`, { replace: true });
        }
      } catch (error) {
        console.error("=== Payment Callback Error ===");
        console.error("Error details:", error);
        console.error("Error response:", error?.response?.data);
        const errorMessage = error?.response?.data?.message || "Có lỗi xảy ra khi xử lý thanh toán.";
        console.log("Redirecting to /payment/failure with error:", errorMessage);
        const failureParams = new URLSearchParams({
          error: errorMessage,
        });
        navigate(`/payment/failure?${failureParams.toString()}`, { replace: true });
      } finally {
        setProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  if (!processing) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <Spin size="large" />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CheckCircleOutlined style={{ fontSize: 20, color: "#52c41a" }} />
        <span>Đang xử lý kết quả thanh toán...</span>
      </div>
    </div>
  );
}
