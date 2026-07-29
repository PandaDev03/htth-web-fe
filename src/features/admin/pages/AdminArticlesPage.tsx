import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Popconfirm,
  Select,
  Skeleton,
} from "antd";
import {
  ExternalLink,
  FileText,
  ImagePlus,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import {
  createAdminArticle,
  deleteAdminArticle,
  getAdminArticles,
  uploadArticleThumbnail,
  type CreateArticlePayload,
} from "@/features/articles/api/articleApi";
import { getArticlePath } from "@/shared/config/path";

const { TextArea } = Input;
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function AdminArticlesPage() {
  const [form] = Form.useForm<CreateArticlePayload>();
  const fileInput = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const articlesQuery = useQuery({
    queryKey: ["admin", "articles"],
    queryFn: getAdminArticles,
  });
  const uploadMutation = useMutation({
    mutationFn: uploadArticleThumbnail,
    onSuccess: (result) => {
      form.setFieldValue("thumbnailUrl", result.url);
      setThumbnailPreview(result.url);
      toast.success("Đã upload thumbnail.");
    },
    onError: (error) => {
      form.setFieldValue("thumbnailUrl", undefined);
      setThumbnailPreview(null);
      toast.error(
        error instanceof Error ? error.message : "Không thể upload thumbnail.",
      );
    },
  });
  const createMutation = useMutation({
    mutationFn: createAdminArticle,
    onSuccess: async (result) => {
      toast.success(result.message || "Đã đăng bài viết.");
      form.resetFields();
      setThumbnailPreview(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "articles"] }),
        queryClient.invalidateQueries({ queryKey: ["articles"] }),
      ]);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Không thể đăng bài viết.",
      ),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAdminArticle,
    onSuccess: async (result) => {
      toast.success(result.message || "Đã xóa bài viết.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa bài viết.",
      ),
  });

  const selectThumbnail = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploadMutation.isPending) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      toast.error("Thumbnail chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Thumbnail không được vượt quá 5MB.");
      return;
    }
    setThumbnailPreview(URL.createObjectURL(file));
    uploadMutation.mutate(file);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
          Nội dung website
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Bài viết
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Đăng sự kiện, cập nhật và thông báo. Bài mới sẽ xuất hiện trên Home
          page ngay sau khi đăng.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]">
        <Card
          className="border-slate-200 shadow-sm"
          styles={{ body: { padding: 24 } }}
        >
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <FileText size={20} />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">Thêm bài viết mới</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Thumbnail tỷ lệ 16:9 sẽ hiển thị đẹp nhất trên card.
              </p>
            </div>
          </div>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ category: "Cập nhật" }}
            onFinish={(values) => createMutation.mutate(values)}
          >
            <Form.Item
              name="thumbnailUrl"
              hidden
              rules={[
                { required: true, message: "Vui lòng upload thumbnail." },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Thumbnail" required>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploadMutation.isPending}
                className="group relative flex aspect-[16/9] w-full overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 transition hover:border-amber-400 hover:bg-amber-50/50 disabled:cursor-wait"
              >
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Xem trước thumbnail"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="m-auto flex flex-col items-center gap-2 text-slate-400">
                    <ImagePlus size={28} />
                    <span className="text-xs font-semibold">
                      Chọn ảnh thumbnail
                    </span>
                    <span className="text-[11px]">
                      JPG, PNG, WEBP, GIF · tối đa 5MB
                    </span>
                  </span>
                )}
                {uploadMutation.isPending && (
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-white">
                    <Loader2 size={24} className="animate-spin" />
                  </span>
                )}
                {thumbnailPreview && !uploadMutation.isPending && (
                  <span className="absolute inset-x-0 bottom-0 bg-slate-950/65 px-3 py-2 text-center text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                    Nhấn để đổi ảnh
                  </span>
                )}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={selectThumbnail}
              />
            </Form.Item>
            <Form.Item
              name="category"
              label="Loại bài viết"
              rules={[
                { required: true, message: "Vui lòng chọn loại bài viết." },
              ]}
            >
              <Select
                options={[
                  { value: "Cập nhật", label: "Cập nhật" },
                  { value: "Sự kiện", label: "Sự kiện" },
                  { value: "Thông báo", label: "Thông báo" },
                  { value: "Bảo trì", label: "Bảo trì" },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[
                { required: true, message: "Vui lòng nhập tiêu đề." },
                { max: 255, message: "Tối đa 255 ký tự." },
              ]}
            >
              <Input
                placeholder="Nhập tiêu đề bài viết"
                showCount
                maxLength={255}
              />
            </Form.Item>
            <Form.Item
              name="content"
              label="Nội dung"
              rules={[
                { required: true, message: "Vui lòng nhập nội dung." },
                { max: 50_000, message: "Nội dung quá dài." },
              ]}
            >
              <TextArea
                rows={9}
                placeholder="Viết đầy đủ nội dung sự kiện hoặc cập nhật..."
                showCount
                maxLength={50_000}
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<Send size={16} />}
              loading={createMutation.isPending}
              disabled={uploadMutation.isPending}
              className="w-full"
            >
              Đăng bài viết
            </Button>
          </Form>
        </Card>

        <section aria-labelledby="articles-list-heading">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2
                id="articles-list-heading"
                className="text-base font-bold text-slate-900"
              >
                Bài viết đã đăng
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {articlesQuery.data?.length ?? 0} bài viết
              </p>
            </div>
          </div>
          {articlesQuery.isError && (
            <Alert
              className="mb-4"
              type="error"
              showIcon
              message="Không thể tải danh sách"
              description={
                articlesQuery.error instanceof Error
                  ? articlesQuery.error.message
                  : undefined
              }
            />
          )}
          {articlesQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <Skeleton active />
                </Card>
              ))}
            </div>
          ) : articlesQuery.data?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {articlesQuery.data.map((article) => (
                <article
                  key={article.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-200 hover:shadow-md"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                    <img
                      src={article.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                    />
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        {article.category}
                      </span>
                      <time className="text-[10px] text-slate-400">
                        {dateFormatter.format(new Date(article.createdAt))}
                      </time>
                    </div>
                    <h3 className="text-base font-bold leading-6 text-slate-900">
                      {article.title}
                    </h3>
                    <p
                      className="mt-2 overflow-hidden text-xs leading-5 text-slate-500"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {article.content}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <Link
                        to={getArticlePath(article.id)}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
                      >
                        Xem bài <ExternalLink size={13} />
                      </Link>
                      <Popconfirm
                        title="Xóa bài viết?"
                        description="Thao tác này không thể hoàn tác."
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => deleteMutation.mutate(article.id)}
                      >
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Xóa ${article.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có bài viết nào"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminArticlesPage;
