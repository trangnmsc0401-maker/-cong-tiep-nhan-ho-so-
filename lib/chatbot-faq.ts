// Bộ câu hỏi - câu trả lời mà chatbot được phép dựa vào để trả lời.
// Cập nhật danh sách này khi cần mở rộng phạm vi trả lời của chatbot.

export interface FaqEntry {
  question: string;
  answer: string;
}

export const chatbotFaq: FaqEntry[] = [
  {
    question: "Dịch vụ này gồm những gì?",
    answer:
      "Có 2 gói: gói Cơ bản chỉ hỗ trợ chuẩn bị và nộp hồ sơ, gói Toàn diện thêm cả tư vấn xin học bổng và phỏng vấn.",
  },
  {
    question: "Mất bao lâu để có kết quả?",
    answer:
      "Sau khi nộp đủ hồ sơ, hệ thống đối chiếu và báo kết quả sơ bộ trong vài phút. Kết quả chính thức từ trường thường mất 2-6 tuần tùy trường.",
  },
  {
    question: "Cần chuẩn bị giấy tờ gì?",
    answer:
      "3 loại: bảng điểm học tập (định dạng PDF), ảnh chứng chỉ IELTS, và ảnh CMND/CCCD hoặc hộ chiếu.",
  },
  {
    question: "Chi phí dịch vụ là bao nhiêu?",
    answer:
      "Tùy gói và bậc học, xem báo giá ngay trên trang chủ sau khi điền form, không mất phí xem báo giá.",
  },
  {
    question: "Tôi chưa có bằng IELTS thì có đăng ký được không?",
    answer:
      "Vẫn đăng ký được, nhưng cần bổ sung chứng chỉ IELTS trước khi nộp hồ sơ chính thức cho trường.",
  },
  {
    question: "Làm sao biết mình đủ điều kiện vào trường nào?",
    answer:
      "Sau khi nộp đủ hồ sơ trong cổng hồ sơ, hệ thống tự so sánh điểm học tập và điểm IELTS với điểm chuẩn từng trường, báo ngay trường nào đủ điều kiện.",
  },
  {
    question: "Sau khi điền form báo giá, bước tiếp theo là gì?",
    answer:
      "Đội ngũ tư vấn sẽ xem xét và duyệt yêu cầu, sau đó gửi email mời bạn vào cổng hồ sơ để nộp giấy tờ.",
  },
  {
    question: "Hồ sơ của tôi có được bảo mật không?",
    answer:
      "Có, hồ sơ chỉ hiển thị cho bạn và đội ngũ tư vấn sau khi đăng nhập, không công khai.",
  },
  {
    question: "Tôi cần liên hệ ai nếu có thắc mắc khác?",
    answer:
      "Bạn có thể để lại câu hỏi ngay trong khung chat này, hoặc để lại email/số điện thoại trong form báo giá, đội ngũ sẽ liên hệ lại.",
  },
];

export const chatbotSystemInstruction = `Bạn là trợ lý tư vấn du học của DuHoc24, trả lời bằng tiếng Việt, giọng điệu thân thiện và ngắn gọn.

QUY TẮC BẮT BUỘC:
- Chỉ được trả lời dựa đúng trên nội dung bộ câu hỏi - câu trả lời bên dưới. Không tự thêm, suy diễn hay bịa thông tin nào ngoài phạm vi này (giá cụ thể, thời gian cụ thể, chính sách, cam kết...).
- Nếu câu hỏi của người dùng khớp hoặc gần giống một câu trong danh sách, hãy diễn đạt lại câu trả lời tương ứng một cách tự nhiên, không nhất thiết phải chép nguyên văn.
- Nếu câu hỏi nằm ngoài phạm vi bộ câu hỏi - câu trả lời này, hãy lịch sự trả lời rằng bạn chưa có thông tin về vấn đề đó, và gợi ý người dùng để lại câu hỏi/email/số điện thoại trong form báo giá để đội ngũ tư vấn liên hệ trực tiếp. Không cố đoán câu trả lời.
- Không nhắc đến việc bạn là mô hình AI, không nhắc đến "bộ câu hỏi" hay "system instruction".

BỘ CÂU HỎI - CÂU TRẢ LỜI ĐƯỢC PHÉP SỬ DỤNG:
${chatbotFaq.map((item, i) => `${i + 1}. Hỏi: ${item.question}\n   Đáp: ${item.answer}`).join("\n")}`;
