# Ghép UI

Menu admin: **Tools > Ghép UI**, route **/admin/ui-composer**. Ghép fashion giữ route cũ và nằm cùng nhóm Tools.

Tool dùng React + Canvas 2D. Menu và res được lưu tại trình duyệt hoặc xuất ra JSON; không cần API mới, không ghi vào thư mục assets của game.

## Sử dụng

1. Bắt đầu với Menu trống, đặt tên và kích thước canvas. **Menu mới** tạo thiết kế với ID mới, giữ thư viện res đang upload.
2. Chọn scale đúng thư mục res (x1–x4), upload một hoặc nhiều PNG/JPG/WEBP.
3. Chọn layer trên canvas hoặc trong Layers; nhấn res để gán. Nếu chưa chọn layer, nhấn res tạo layer ảnh mới.
4. Chọn cách ghép:
   - **Stretch**: kéo giãn vùng ảnh.
   - **Contain**: giữ tỷ lệ ảnh, căn giữa.
   - **Tile**: lặp vùng ảnh theo kích thước logic của res.
   - **9-slice**: giữ góc/biên, kéo phần giữa. Crop hỗ trợ cắt vùng trên spritesheet.
5. Chỉnh X/Y/rộng/cao, màu, chữ, crop/biên. Kéo để di chuyển; kéo ô xanh góc dưới phải để resize. Mũi tên căn pixel; Shift di chuyển 10px. Snap và lưới hỗ trợ căn.
6. Thêm màn hình trong **Menu & canvas** hoặc **Thuộc tính > Hiện ở màn hình**. Layer mặc định dùng **Tất cả màn hình**; có thể gán vào màn hình riêng. Đổi tên giữ nguyên liên kết. Xóa màn hình chuyển layer về Tất cả màn hình và bỏ đích tab trỏ tới màn hình đó; có thể hoàn tác.
7. Với nhóm tab, gán ảnh nền, ảnh khi chọn và tabIcon riêng từng tab. Chọn **Chuyển màn hình**, rồi gán đích riêng cho mỗi tab. Với item list, gán res khung slot và thêm ảnh/tên/hệ/cấp của item trong Thuộc tính.
8. Chuyển **Preview**, nhấn tab để đổi màn hình hoặc lọc hệ. Lăn chuột/kéo trong list để cuộn. Không phân trang.
9. Nhấn **Lưu Menu** để lưu bản hiện tại; dùng **Mở Menu đã lưu** để mở và chỉnh tiếp. Lưu lại cập nhật cùng Menu ID. Xuất **PNG** cho màn hình đang xem hoặc **JSON** để sao lưu/chuyển máy.

## Lưu Menu, nháp và JSON

IndexedDB tự lưu nháp sau 700ms ngừng chỉnh. **Lưu Menu** tạo/cập nhật bản lưu riêng gồm thuộc tính và các res đã upload. Nháp và danh sách Menu tồn tại theo browser/origin hiện tại; không đồng bộ server.

**Xuất JSON** có hai lựa chọn:

- **Bố cục và thuộc tính**: giữ mọi màn hình/layer, cấu hình crop/slice, scale, ID và tên file res; `dataUrl` là `null`. Khi nhập lại, res hiện “Chưa upload”. Upload ảnh **cùng tên file** để nối lại layer, tabIcon và item, giữ nguyên ID/scale/cấu hình đã lưu.
- **Bố cục, thuộc tính và ảnh res**: kèm base64 của các ảnh đang có, tiện sao lưu/chia sẻ một file. Res chưa upload vẫn giữ metadata.

Upload ảnh cùng tên thay ảnh hiện tại, không tạo ID mới. Ảnh không khớp tên sẽ thêm vào thư viện; có thể gán thủ công cho layer. Dùng JSON để giữ bản sao ngoài trình duyệt.

Schema: `htth-ui-composer`, **version 2**. JSON/nháp version 1 vẫn nhập được; các màn hình và đích tab cũ được chuyển sang cấu hình mới.

- Menu: `id`, `name`, `width`, `height`, `background`, `screens`.
- Screen: `id`, `name`; `all` dành cho layer chung. Menu mới không có màn hình cố định.
- Assets: `id`, `name`, `dataUrl` (base64 PNG/JPG/WEBP hoặc `null`), `width`, `height`, `resourceScale`.
- Nodes: `id`, `name`, `kind`, `screen`, x/y/width/height, res thường/active, renderMode, crop, slice, màu/chữ, visibility/lock, cấu hình tab/list.
- Mảng nodes vẽ từ trước đến sau; layer cuối nằm trên cùng.
- `kind`: panel, image, text, button, tabs, itemList.
- Item: id, name, element (Zoan/Logia/Paramecia), assetId, level.
- `screenTargets`: đích màn hình theo thứ tự nhãn tab; `null` nghĩa là không chuyển màn hình.
- Zoom, lưới, selection, filter và scroll hiện tại là trạng thái preview, không thuộc layout. PNG xuất vùng list đang xem; JSON giữ tất cả item.

Import kiểm tra schema, dữ liệu số/màu, ID res/màn hình, ảnh decode và giới hạn tài nguyên. Tối đa 32 màn hình, 12 nhãn/nhóm tab, 200 res, 300 layer, 500 item/list; 4 MB/ảnh upload, 24 MB tổng res, 16 triệu pixel/ảnh và 64 triệu pixel tổng. JSON nhập tối đa 36 MB.

## Handoff Unity

Đây là công cụ duyệt bố cục và ghép res. JSON chưa tự tạo prefab hoặc được game tự đọc.

Client hiện vẽ UI bằng mGraphics, AvMain.paintRect, paintRectButton và các mảnh drawRegion. Tool giữ tọa độ **pixel logic, gốc trên trái**, thay vì bố cục HTML responsive.

- X/Y/rộng/cao của node là pixel logic. Canvas 760×440 vẫn giữ tọa độ này khi web zoom.
- Crop và slice là **pixel ảnh gốc**. Res x4, crop 80px hoặc biên 32px tương ứng 20px/8px logic.
- Khi triển khai, map name/id sang resource path/ID thật của game; không dùng asset UUID như icon ID.
- Dùng thứ tự nodes và screen để tổ chức các lệnh vẽ. Tile/9-slice cần lặp/vẽ từng vùng bằng renderer tương ứng của game.
- Canvas và PNG export dùng cùng font TTF của game: fontnho cho chữ thường, fontbu cho chữ đậm. Cần đối chiếu kerning, vị trí baseline, clipping, scale và input với client. Button chỉ minh họa và hiện thông báo khi nhấn.
- Background, tab, button, slot có thể là ảnh riêng hoặc crop từ sheet; không bắt buộc một ảnh lớn cho toàn menu.

## Kiểm tra không build

Tại htth-web-fe:

    node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false
    node scripts/test-ui-composer.mjs
    node node_modules/eslint/bin/eslint.js src/features/admin/ui-composer src/features/admin/pages/AdminUiComposerPage.tsx

Test logic kiểm tra JSON v1/v2, màn hình tùy chỉnh, liên kết res khi upload lại, filter/list, hit-test, khoảng trống giữa tab và biên 9-slice x4/target nhỏ/crop. Browser kiểm tra lưu/mở nhiều Menu, import/export JSON, khôi phục PNG và preview; không chạy production build.
