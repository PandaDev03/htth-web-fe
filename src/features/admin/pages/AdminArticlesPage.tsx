import { Editor } from "@tinymce/tinymce-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Skeleton,
  Switch,
  Upload,
  type UploadProps,
} from "antd";
import {
  ExternalLink,
  FileText,
  ImagePlus,
  Loader2,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import {
  createAdminArticle,
  deleteAdminArticle,
  getAdminArticles,
  uploadArticleThumbnail,
  type CreateArticlePayload,
} from "@/features/articles/api/articleApi";
import { getArticleSummary } from "@/features/articles/utils/articlePresentation";
import { getArticlePath } from "@/shared/config/path";

type AdminArticleFormValues = CreateArticlePayload & {
  fireworksEnabled?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function AdminArticlesPage() {
  const [form] = Form.useForm<AdminArticleFormValues>();
  const fireworksEnabled = Form.useWatch("fireworksEnabled", form);
  const queryClient = useQueryClient();
  const editorRef = useRef<{ setContent: (content: string) => void } | null>(
    null,
  );
  const localPreviewRef = useRef<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const articlesQuery = useQuery({
    queryKey: ["admin", "articles"],
    queryFn: getAdminArticles,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadArticleThumbnail,
    onSuccess: (result) => {
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
        localPreviewRef.current = null;
      }
      form.setFieldValue("thumbnailUrl", result.url);
      setThumbnailPreview(result.url);
      toast.success("Đã upload thumbnail.");
    },
    onError: (error) => {
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
        localPreviewRef.current = null;
      }
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
      editorRef.current?.setContent("");
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

  useEffect(
    () => () => {
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    },
    [],
  );

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      toast.error("Thumbnail chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.");
      return Upload.LIST_IGNORE;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Thumbnail không được vượt quá 5MB.");
      return Upload.LIST_IGNORE;
    }
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    localPreviewRef.current = URL.createObjectURL(file);
    setThumbnailPreview(localPreviewRef.current);
    return true;
  };

  const customUpload: UploadProps["customRequest"] = ({
    file,
    onError,
    onSuccess,
  }) => {
    uploadMutation.mutate(file as File, {
      onSuccess: (result) => onSuccess?.(result),
      onError: (error) =>
        onError?.(
          error instanceof Error
            ? error
            : new Error("Không thể upload thumbnail."),
        ),
    });
  };

  const submitArticle = (values: AdminArticleFormValues) => {
    const payload: CreateArticlePayload = {
      title: values.title,
      description: values.description?.trim() || undefined,
      category: values.category,
      content: values.content,
      thumbnailUrl: values.thumbnailUrl,
    };

    if (values.fireworksEnabled && values.eventProgress) {
      payload.eventKey = "fireworks";
      payload.eventProgress = {
        current: values.eventProgress.current,
        target: values.eventProgress.target,
        participants: values.eventProgress.participants,
        nextMilestone: values.eventProgress.nextMilestone,
      };
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
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
            initialValues={{
              category: "Cập nhật",
              fireworksEnabled: false,
              eventProgress: {
                current: 0,
                target: 100000,
                participants: 0,
                nextMilestone: 75000,
              },
            }}
            onFinish={submitArticle}
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
              <Upload
                accept="image/jpeg,image/png,image/webp,image/gif"
                showUploadList={false}
                beforeUpload={beforeUpload}
                customRequest={customUpload}
                disabled={uploadMutation.isPending}
                className="block"
              >
                <div className="group relative flex aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 transition hover:border-amber-400 hover:bg-amber-50/50">
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
                </div>
              </Upload>
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
              name="description"
              label="Mô tả ngắn"
              rules={[{ max: 500, message: "Tối đa 500 ký tự." }]}
            >
              <Input.TextArea
                placeholder="Nội dung tóm tắt hiển thị trên card bài viết"
                rows={3}
                showCount
                maxLength={500}
              />
            </Form.Item>

            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Thanh tiến trình Pháo hoa
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Bật khi bài viết là sự kiện Đốt Pháo toàn server.
                    </p>
                  </div>
                </div>
                <Form.Item name="fireworksEnabled" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>

              {fireworksEnabled && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Form.Item
                    name={["eventProgress", "current"]}
                    label="Pháo đã đốt"
                    rules={[
                      { required: true, message: "Vui lòng nhập số pháo." },
                    ]}
                  >
                    <InputNumber min={0} precision={0} className="w-full" />
                  </Form.Item>
                  <Form.Item
                    name={["eventProgress", "target"]}
                    label="Mốc tổng"
                    rules={[
                      { required: true, message: "Vui lòng nhập mốc tổng." },
                    ]}
                  >
                    <InputNumber min={1} precision={0} className="w-full" />
                  </Form.Item>
                  <Form.Item
                    name={["eventProgress", "participants"]}
                    label="Người tham gia"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số người tham gia.",
                      },
                    ]}
                  >
                    <InputNumber min={0} precision={0} className="w-full" />
                  </Form.Item>
                  <Form.Item
                    name={["eventProgress", "nextMilestone"]}
                    label="Mốc kế tiếp"
                    rules={[
                      { required: true, message: "Vui lòng nhập mốc kế tiếp." },
                    ]}
                  >
                    <InputNumber min={0} precision={0} className="w-full" />
                  </Form.Item>
                </div>
              )}
            </div>

            <Form.Item
              name="content"
              hidden
              rules={[
                { required: true, message: "Vui lòng nhập nội dung." },
                { max: 50_000, message: "Nội dung quá dài." },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Nội dung" required>
              <Editor
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                licenseKey="gpl"
                onInit={(_event, editor) => {
                  editorRef.current = editor;
                }}
                onEditorChange={(value) => form.setFieldValue("content", value)}
                init={{
                  height: 360,
                  menubar: false,
                  branding: false,
                  plugins:
                    "advlist autolink lists link charmap table code wordcount",
                  toolbar:
                    "undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright | bullist numlist | link table | removeformat code",
                  content_style:
                    "body { font-family: Plus Jakarta Sans, sans-serif; font-size: 14px; color: #334155; padding: 12px; }",
                }}
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
                    <h3 className="line-clamp-2 text-base font-bold leading-6 text-slate-900">
                      {article.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-400">
                      /articles/{article.slug ?? article.id}
                    </p>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                      {getArticleSummary(article)}
                    </p>
                    {article.eventKey === "fireworks" && (
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                        <Sparkles size={12} /> Có progress Pháo hoa
                      </span>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <Link
                        to={getArticlePath(article.slug ?? article.id)}
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
