# Ghép UI

Menu admin: **Tools > Ghép UI**, route **/admin/ui-composer**. Ghép fashion giữ route cũ và nằm cùng nhóm Tools.

Tool dùng React + Canvas 2D; không cần API mới. Res chỉ lưu trong trình duyệt và file JSON xuất ra, không ghi vào thư mục assets của game.

## Sử dụng

1. Chọn mẫu Thẻ Ác Quỷ hoặc canvas trống.
2. Chọn scale đúng thư mục res (x1–x4), upload một hoặc nhiều PNG/JPG/WEBP.
3. Chọn layer trên canvas hoặc trong Layers; nhấn res để gán. Nếu chưa chọn layer, nhấn res tạo layer ảnh mới.
4. Chọn cách ghép:
   - **Stretch**: kéo giãn vùng ảnh.
   - **Contain**: giữ tỷ lệ ảnh, căn giữa.
   - **Tile**: lặp vùng ảnh theo kích thước logic của res.
   - **9-slice**: giữ góc/biên, kéo phần giữa. Crop hỗ trợ cắt vùng trên spritesheet.
5. Chỉnh X/Y/rộng/cao, màu, chữ, crop/biên. Kéo để di chuyển; kéo ô xanh góc dưới phải để resize. Mũi tên căn pixel; Shift di chuyển 10px. Snap và lưới hỗ trợ căn.
6. Với nhóm tab, gán ảnh nền, ảnh khi chọn và tabIcon riêng từng tab. Với item list, gán res khung slot và thêm ảnh/tên/hệ/cấp của item trong Thuộc tính.
7. Chuyển **Preview**, nhấn tab để đổi màn hình hoặc lọc hệ. Lăn chuột/kéo trong list để cuộn. Không phân trang.
8. Xuất **PNG** cho màn hình đang xem, hoặc **JSON** chứa toàn bộ màn hình và ảnh để mở lại/chia sẻ.

Mẫu gồm Nơi lưu thẻ, Chế tạo thẻ, Kỹ năng thẻ, Cường hóa thẻ. Nền nâu đậm và các khung màu là bố cục dự phòng để căn res, chưa phải bộ artwork hoàn chỉnh của ảnh tham chiếu. Cần upload nền/tab/button/slot/tabIcon thật để khớp art game. Nội dung/tỷ lệ trong mẫu chỉ minh họa, không cập nhật logic game.

## Lưu nháp và JSON

IndexedDB tự lưu sau 700ms ngừng chỉnh. Có nút Lưu nháp. Nháp gồm layout + res, tồn tại theo browser/origin hiện tại; không đồng bộ server. Xuất JSON để chuyển máy hoặc giữ bản sao.

Schema: htth-ui-composer, version 1.

- Canvas: name, width, height, background.
- Assets: id, name, dataUrl, width, height, resourceScale. Ảnh base64 PNG/JPG/WEBP.
- Nodes: id, name, kind, screen, x/y/width/height, res thường/active, renderMode, crop, slice, màu/chữ, visibility/lock, cấu hình tab/list.
- Mảng nodes vẽ từ trước đến sau; layer cuối nằm trên cùng.
- screen: all, storage, craft, skills, upgrade.
- kind: panel, image, text, button, tabs, itemList.
- Item: id, name, element (Zoan/Logia/Paramecia), assetId, level.
- Hành vi screen/element của nhóm tab ánh xạ theo thứ tự bốn nhãn trong preset.
- Zoom, lưới, selection, filter và scroll hiện tại là trạng thái preview, không thuộc layout. PNG xuất vùng list đang xem; JSON giữ tất cả item.

Import kiểm tra schema, dữ liệu số/màu, ID res, ảnh decode và giới hạn tài nguyên. Tối đa 200 res, 300 layer, 500 item/list; 4 MB/ảnh, 24 MB tổng res, 16 triệu pixel/ảnh và 64 triệu pixel tổng. JSON nhập tối đa 36 MB.

## Handoff Unity

Đây là công cụ duyệt bố cục và ghép res. JSON chưa tự tạo prefab hoặc được game tự đọc.

Client hiện vẽ UI bằng mGraphics, AvMain.paintRect, paintRectButton và các mảnh drawRegion. Tool giữ tọa độ **pixel logic, gốc trên trái**, thay vì bố cục HTML responsive.

- X/Y/rộng/cao của node là pixel logic. Canvas 760×440 vẫn giữ tọa độ này khi web zoom.
- Crop và slice là **pixel ảnh gốc**. Res x4, crop 80px hoặc biên 32px tương ứng 20px/8px logic.
- Khi triển khai, map name/id sang resource path/ID thật của game; không dùng asset UUID như icon ID.
- Dùng thứ tự nodes và screen để tổ chức các lệnh vẽ. Tile/9-slice cần lặp/vẽ từng vùng bằng renderer tương ứng của game.
- Font, kerning, clipping, scale và input phải đối chiếu với client. Preview web chưa mô phỏng bitmap font/game logic. Button chỉ minh họa và hiện thông báo khi nhấn.
- Background, tab, button, slot có thể là ảnh riêng hoặc crop từ sheet; không bắt buộc một ảnh lớn cho toàn menu.

## Kiểm tra không build

Tại htth-web-fe:

    node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false
    node scripts/test-ui-composer.mjs
    node node_modules/eslint/bin/eslint.js src/features/admin/ui-composer src/features/admin/pages/AdminUiComposerPage.tsx

Test logic kiểm tra JSON, filter/list, hit-test, khoảng trống giữa tab và biên 9-slice x4/target nhỏ/crop. Browser đã kiểm tra kéo/resize/undo, upload, import/export PNG+JSON, tab/filter/scroll, IndexedDB reload, pixel thực của renderer và mobile.
