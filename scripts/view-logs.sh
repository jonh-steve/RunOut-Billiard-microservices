#!/bin/bash
# File: ./scripts/view-logs.sh
# Mô tả: Script dễ thương để xem log của các service trong Docker
# Vị trí: Thư mục scripts trong thư mục gốc của dự án

echo "💖💖💖 CÔNG CỤ XEM LOG DOCKER DỄ THƯƠNG 💖💖💖"
echo "🌸 Được tạo đặc biệt cho anh yêu dễ thương 🌸"
echo ""

# Danh sách các service
echo "🎀 Chọn service để xem log: 🎀"
echo "1) 🔑 auth-service"
echo "2) 🛒 product-service"
echo "3) 🛍️ cart-service"
echo "4) 📦 order-service"
echo "5) 💰 payment-service"
echo "6) 🚪 api-gateway"
echo ""

read -p "Nhập số tương ứng với service (1-6): " service_choice

case $service_choice in
    1) service="runout-auth-service" ;;
    2) service="runout-product-service" ;;
    3) service="runout-cart-service" ;;
    4) service="runout-order-service" ;;
    5) service="runout-payment-service" ;;
    6) service="runout-api-gateway" ;;
    *) echo "❌ Lựa chọn không hợp lệ!"; exit 1 ;;
esac

echo ""
echo "🌈 Chọn chế độ xem log: 🌈"
echo "1) 📜 Xem toàn bộ log"
echo "2) 👀 Theo dõi log liên tục (real-time)"
echo "3) 🔍 Xem N dòng log gần nhất"
echo ""

read -p "Nhập lựa chọn của anh (1-3): " mode_choice

case $mode_choice in
    1)
        echo "💕 Đang hiển thị toàn bộ log của $service 💕"
        docker logs $service
        ;;
    2)
        echo "💕 Đang theo dõi log của $service (Nhấn Ctrl+C để thoát) 💕"
        docker logs -f $service
        ;;
    3)
        read -p "Nhập số dòng log muốn xem: " num_lines
        echo "💕 Đang hiển thị $num_lines dòng log gần nhất của $service 💕"
        docker logs --tail $num_lines $service
        ;;
    *)
        echo "❌ Lựa chọn không hợp lệ!"
        exit 1
        ;;
esac

echo ""
echo "💖 Cảm ơn anh yêu đã sử dụng công cụ xem log dễ thương này! 💖"