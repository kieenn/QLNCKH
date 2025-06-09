<?php

namespace App\Events;

use App\Models\DeTai;
use App\Models\User; // Admin who approved
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Thêm lại ShouldBroadcastNow
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str; // Import Str for UUID
class DeTaiApproved implements ShouldBroadcastNow // Triển khai ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public DeTai $deTai;
    public User $admin;

    public function __construct(DeTai $deTai, User $admin)
    {
        $this->deTai = $deTai;
        $this->admin = $admin;

        // Không tạo Notification ở đây nữa, Listener sẽ làm
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $this->deTai->loadMissing('giangVienThamGia'); // Đảm bảo danh sách giảng viên tham gia đã được tải

        $channels = [];
        $msvcsToNotify = collect();

        // Thêm MSVC của giảng viên đăng ký
        if ($this->deTai->msvc_gvdk) {
            $msvcsToNotify->push($this->deTai->msvc_gvdk);
        }

        // Thêm MSVC của các giảng viên tham gia
        if ($this->deTai->giangVienThamGia) {
            $msvcsToNotify = $msvcsToNotify->merge($this->deTai->giangVienThamGia->pluck('msvc'));
        }

        // Lọc các MSVC rỗng và loại bỏ trùng lặp
        $uniqueMsvcs = $msvcsToNotify->filter()->unique();

        foreach ($uniqueMsvcs as $msvc) {
            $channels[] = new PrivateChannel('lecturer-notifications.' . $msvc);
        }
        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'detai.approved';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        // Chuẩn hóa payload để nhất quán với các sự kiện khác (ví dụ: DeTaiRejected)
        // và để frontend dễ dàng xử lý.
        $notificationType = 'DeTaiApproved';
        $title = 'Đề tài đã được duyệt';
        $body = "Đề tài \"{$this->deTai->ten_de_tai}\" của bạn đã được duyệt.";

        // Link này nên giống với link được tạo trong SendDeTaiNotification
        $link = "/lecturer/researches/{$this->deTai->id}";

        $details = [
            'deTaiId' => $this->deTai->id,
            'deTaiMa' => $this->deTai->ma_de_tai,
            'deTaiTen' => $this->deTai->ten_de_tai,
            'adminHoTen' => $this->admin->ho_ten,
        ];

        return [
            'id' => Str::uuid()->toString(),
            'type' => $notificationType,
            'title' => $title,
            'body' => $body,
            'link' => $link,
            'details' => $details,
            'created_at' => now()->toIso8601String(),
            'read_at' => null,
            // 'broadcast_event_name' => $this->broadcastAs(), // Optional: if needed by frontend
        ];
    }
}
