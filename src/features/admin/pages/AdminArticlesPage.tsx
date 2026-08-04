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
  Pencil,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import {
  createAdminArticle,
  deleteAdminArticle,
  getAdminArticles,
  updateAdminArticle,
  uploadArticleThumbnail,
  type Article,
  type CreateArticlePayload,
} from "@/features/articles/api/articleApi";
import { getArticleSummary } from "@/features/articles/utils/articlePresentation";
import { getArticlePath } from "@/shared/config/path";

type AdminArticleFormValues = Omit<CreateArticlePayload, "progress"> & {
  progressEnabled?: boolean;
  progress?: Omit<
    NonNullable<CreateArticlePayload["progress"]>,
    "milestones"
  > & {
    milestonesJson?: string;
  };
};

type TinyEditorRef = {
  getContent: () => string;
  setContent: (content: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const defaultMilestonesJson = JSON.stringify(
  [
    [1, 1000, 1, []],
    [2, 3000, 2, []],
    [3, 5000, 3, []],
    [4, 10000, 4, []],
  ],
  null,
  2,
);

const defaultProgressValues: NonNullable<AdminArticleFormValues["progress"]> = {
  key: "fireworks-server-2026",
  title: "Cùng nhau đốt pháo, nhận quà toàn server",
  currentLabel: "Pháo đã đốt toàn server",
  unit: "pháo",
  statusLabel: "Đang diễn ra",
  eventId: 12,
  scoreIndex: 0,
  milestonesJson: defaultMilestonesJson,
};

const defaultArticleFormValues: Partial<AdminArticleFormValues> = {
  category: "Cập nhật",
  progressEnabled: false,
  progress: defaultProgressValues,
};

const rewardsToTuples = (
  rewards: NonNullable<Article["progress"]>["milestones"][number]["rewards"],
) =>
  rewards
    .map(
      (reward) =>
        [
          Number(reward.sourceId),
          Number(reward.itemId),
          Number(reward.quantity),
        ] as [number, number, number],
    )
    .filter(
      ([itemType, itemId, quantity]) =>
        [itemType, itemId, quantity].every(Number.isInteger) &&
        itemType > 0 &&
        itemId >= 0 &&
        quantity > 0,
    );

const progressMilestonesToJson = (
  milestones: NonNullable<Article["progress"]>["milestones"],
) =>
  JSON.stringify(
    milestones.map((milestone, index) => [
      milestone.id ?? index + 1,
      milestone.target,
      milestone.sort ?? index + 1,
      rewardsToTuples(milestone.rewards),
    ]),
    null,
    2,
  );

const articleToFormValues = (article: Article): AdminArticleFormValues => ({
  title: article.title,
  description: article.description ?? undefined,
  category: article.category,
  content: article.content,
  thumbnailUrl: article.thumbnailUrl,
  progressEnabled: Boolean(article.progress),
  progress: article.progress
    ? {
        key: article.progress.key ?? undefined,
        title: article.progress.title ?? undefined,
        currentLabel: article.progress.currentLabel ?? undefined,
        unit: article.progress.unit ?? undefined,
        statusLabel: article.progress.statusLabel ?? undefined,
        eventId: article.progress.eventId,
        scoreIndex: article.progress.scoreIndex,
        milestonesJson: progressMilestonesToJson(article.progress.milestones),
      }
    : defaultProgressValues,
});

function AdminArticlesPage() {
  const [form] = Form.useForm<AdminArticleFormValues>();
  const progressEnabled = Form.useWatch("progressEnabled", form);
  const queryClient = useQueryClient();
  const editorRef = useRef<TinyEditorRef | null>(null);
  const localPreviewRef = useRef<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [editingArticleTitle, setEditingArticleTitle] = useState<string | null>(
    null,
  );

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

  const resetArticleForm = () => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = null;
    }
    setEditingArticleId(null);
    setEditingArticleTitle(null);
    form.resetFields();
    editorRef.current?.setContent("");
    setThumbnailPreview(null);
  };

  const invalidateArticleQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "articles"] }),
      queryClient.invalidateQueries({ queryKey: ["articles"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createAdminArticle,
    onSuccess: async (result) => {
      toast.success(result.message || "Đã đăng bài viết.");
      resetArticleForm();
      await invalidateArticleQueries();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Không thể đăng bài viết.",
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: CreateArticlePayload;
    }) => updateAdminArticle(id, payload),
    onSuccess: async (result) => {
      toast.success(result.message || "Đã cập nhật bài viết.");
      resetArticleForm();
      await invalidateArticleQueries();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật bài viết.",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminArticle,
    onSuccess: async (result, deletedId) => {
      toast.success(result.message || "Đã xóa bài viết.");
      if (editingArticleId === deletedId) resetArticleForm();
      await invalidateArticleQueries();
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

  const syncEditorContent = () => {
    const content = editorRef.current?.getContent() ?? "";
    form.setFieldValue("content", content);
  };

  const startEditArticle = (article: Article) => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = null;
    }
    const values = articleToFormValues(article);
    setEditingArticleId(article.id);
    setEditingArticleTitle(article.title);
    form.setFieldsValue(values);
    editorRef.current?.setContent(article.content);
    setThumbnailPreview(article.thumbnailUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const parseMilestonesJson = (value: string | undefined) => {
    const text = value?.trim();
    if (!text) throw new Error("Vui lòng nhập Milestones JSON.");

    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      throw new Error("Milestones JSON không hợp lệ.");
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Milestones JSON phải là mảng và có ít nhất 1 mốc.");
    }

    return parsed.map((milestone, milestoneIndex) => {
      if (!Array.isArray(milestone) || milestone.length < 4) {
        throw new Error(
          "Mốc " +
            (milestoneIndex + 1) +
            " sai định dạng [id, target, sort, rewards].",
        );
      }

      const tierId = Number(milestone[0]);
      const target = Number(milestone[1]);
      const sort = Number(milestone[2]);
      const rewards = milestone[3];

      if (
        !Number.isInteger(tierId) ||
        !Number.isInteger(target) ||
        !Number.isInteger(sort) ||
        tierId <= 0 ||
        target <= 0 ||
        sort <= 0
      ) {
        throw new Error(
          "Mốc " +
            (milestoneIndex + 1) +
            " có id, target hoặc sort không hợp lệ.",
        );
      }

      if (!Array.isArray(rewards)) {
        throw new Error(
          "Rewards của mốc " + (milestoneIndex + 1) + " phải là mảng.",
        );
      }

      const rewardTuples = rewards.map((reward, rewardIndex) => {
        if (!Array.isArray(reward) || reward.length < 3) {
          throw new Error(
            "Mốc " +
              (milestoneIndex + 1) +
              ", item " +
              (rewardIndex + 1) +
              " sai định dạng [item_type, id, count].",
          );
        }

        const itemType = Number(reward[0]);
        const itemId = Number(reward[1]);
        const count = Number(reward[2]);

        if (
          !Number.isInteger(itemType) ||
          !Number.isInteger(itemId) ||
          !Number.isInteger(count) ||
          itemType <= 0 ||
          itemId < 0 ||
          count <= 0
        ) {
          throw new Error(
            "Mốc " +
              (milestoneIndex + 1) +
              ", item " +
              (rewardIndex + 1) +
              " không hợp lệ.",
          );
        }

        return [itemType, itemId, count] as [number, number, number];
      });

      return [tierId, target, sort, rewardTuples] as [
        number,
        number,
        number,
        [number, number, number][],
      ];
    });
  };

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

    if (values.progressEnabled && values.progress) {
      try {
        payload.progress = {
          key: values.progress.key?.trim() || undefined,
          title: values.progress.title?.trim() || undefined,
          currentLabel: values.progress.currentLabel?.trim() || undefined,
          unit: values.progress.unit?.trim() || undefined,
          statusLabel: values.progress.statusLabel?.trim() || undefined,
          eventId: Number(values.progress.eventId),
          scoreIndex: Number(values.progress.scoreIndex),
          milestones: parseMilestonesJson(values.progress.milestonesJson),
        };
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Cấu hình quà mốc không hợp lệ.",
        );
        return;
      }
    }
    if (editingArticleId) {
      updateMutation.mutate({ id: editingArticleId, payload });
      return;
    }
    createMutation.mutate(payload);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-10">
        <Card
          className="border-slate-200 shadow-sm xl:col-span-8"
          styles={{ body: { padding: 24 } }}
        >
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <FileText size={20} />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">
                {editingArticleId ? "Sửa bài viết" : "Thêm bài viết mới"}
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {editingArticleTitle
                  ? "Đang sửa: " + editingArticleTitle
                  : "Thumbnail tỷ lệ 16:9 sẽ hiển thị đẹp nhất trên card."}
              </p>
            </div>
          </div>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={defaultArticleFormValues}
            onFinish={submitArticle}
            onFinishFailed={() => {
              syncEditorContent();
              toast.error("Vui lòng kiểm tra thumbnail, tiêu đề và nội dung.");
            }}
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
                className="block w-full [&>div]:w-full"
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
                      Thanh tiến trình sự kiện
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Bật khi bài viết cần hiển thị mốc tiến độ riêng.
                    </p>
                  </div>
                </div>
                <Form.Item
                  name="progressEnabled"
                  valuePropName="checked"
                  noStyle
                >
                  <Switch />
                </Form.Item>
              </div>
              {progressEnabled && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Form.Item name={["progress", "key"]} label="Mã tiến trình">
                    <Input placeholder="mid-autumn-2026" maxLength={80} />
                  </Form.Item>
                  <Form.Item name={["progress", "title"]} label="Tiêu đề panel">
                    <Input
                      placeholder="Cùng nhau hoàn thành mục tiêu"
                      maxLength={255}
                    />
                  </Form.Item>
                  <Form.Item
                    name={["progress", "currentLabel"]}
                    label="Nhãn chỉ số"
                  >
                    <Input placeholder="Đã hoàn thành" maxLength={120} />
                  </Form.Item>
                  <Form.Item name={["progress", "unit"]} label="Đơn vị">
                    <Input placeholder="lượt" maxLength={40} />
                  </Form.Item>
                  <Form.Item
                    name={["progress", "statusLabel"]}
                    label="Trạng thái"
                  >
                    <Input placeholder="Đang diễn ra" maxLength={80} />
                  </Form.Item>
                  <Form.Item
                    name={["progress", "eventId"]}
                    label="Mã event trong players.event"
                    rules={[
                      { required: true, message: "Vui lòng nhập mã event." },
                    ]}
                  >
                    <InputNumber min={1} precision={0} className="w-full" />
                  </Form.Item>
                  <Form.Item
                    name={["progress", "scoreIndex"]}
                    label="Vị trí điểm trong event"
                    tooltip="Ví dụ event 12: index 0 là điểm Đốt Pháo, index 1 là điểm Săn boss."
                    rules={[
                      { required: true, message: "Vui lòng nhập vị trí điểm." },
                    ]}
                  >
                    <InputNumber min={0} precision={0} className="w-full" />
                  </Form.Item>

                  <div className="sm:col-span-2">
                    <div className="mb-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs leading-5 text-slate-500">
                      Số hiện tại và người tham gia sẽ tự tính từ bảng players,
                      cột event. Milestones JSON dùng format đồng bộ:
                      [id, target, sort, [[item_type, id, count]]].
                    </div>
                    <Form.Item
                      name={["progress", "milestonesJson"]}
                      label="Milestones JSON"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập Milestones JSON.",
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={10}
                        placeholder='[[1,1000,1,[[4,641,1],[7,12,2]]]]'
                        spellCheck={false}
                      />
                    </Form.Item>
                  </div>
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
                  editor.setContent(form.getFieldValue("content") ?? "");
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
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Button
                type="primary"
                htmlType="submit"
                icon={<Send size={16} />}
                loading={isSubmitting}
                disabled={uploadMutation.isPending}
                className="w-full"
                onClick={syncEditorContent}
              >
                {editingArticleId ? "Cập nhật bài viết" : "Đăng bài viết"}
              </Button>
              {editingArticleId && (
                <Button icon={<X size={16} />} onClick={resetArticleForm}>
                  Hủy sửa
                </Button>
              )}
            </div>
          </Form>
        </Card>

        <div className="xl:col-span-2">
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
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index}>
                    <Skeleton active />
                  </Card>
                ))}
              </div>
            ) : articlesQuery.data?.length ? (
              <div className="space-y-4">
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
                      {article.progress && (
                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                          <Sparkles size={12} /> Event{" "}
                          {article.progress.eventId} / index{" "}
                          {article.progress.scoreIndex}
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
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-700"
                            aria-label={"Sửa " + article.title}
                            onClick={() => startEditArticle(article)}
                          >
                            <Pencil size={15} />
                          </button>
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
    </div>
  );
}

export default AdminArticlesPage;
