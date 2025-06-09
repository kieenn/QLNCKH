<?php

namespace App\Events;
use App\Models\DeTai;
use App\Models\User; // Admin who rejected and Lecturer to notify
use App\Models\Notification; // Import Notification model
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class DeTaiRejected implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public DeTai $deTai;
    public User $admin;
    public string $reason;

    public function __construct(DeTai $deTai, User $admin, string $reason)
    {
        $this->deTai = $deTai;
        $this->admin = $admin;
        $this->reason = $reason;
    }

    public function broadcastOn(): array
    {
        $this->deTai->loadMissing('giangVienThamGia'); // Ensure participants are loaded

        $channels = [];
        $msvcsToNotify = collect();

        // Add MSVC of the registrant lecturer
        if ($this->deTai->msvc_gvdk) {
            $msvcsToNotify->push($this->deTai->msvc_gvdk);
        }

        // Add MSVCs of participating lecturers
        if ($this->deTai->giangVienThamGia) {
            $msvcsToNotify = $msvcsToNotify->merge($this->deTai->giangVienThamGia->pluck('msvc'));
        }

        // Filter out empty MSVCs and get unique ones
        $uniqueMsvcs = $msvcsToNotify->filter()->unique();

        foreach ($uniqueMsvcs as $msvc) {
            $channels[] = new PrivateChannel('lecturer-notifications.' . $msvc);
        }
        return $channels;
    }

    public function broadcastAs()
    {
        return 'detai.rejected';
    }

    public function broadcastWith(): array
    {
        // Payload này dành cho việc phát sóng qua WebSocket.
        $notificationType = 'DeTaiRejected';
        $title = 'Đề tài đã bị từ chối';
        $body = "Đề tài \"{$this->deTai->ten_de_tai}\" của bạn đã bị từ chối.";
        $body .= " Lý do: " . $this->reason;

        $link = "/lecturer/researches/{$this->deTai->id}"; // Link có thể hữu ích cho frontend

        $details = [
            'deTaiId' => $this->deTai->id,
            'deTaiMa' => $this->deTai->ma_de_tai,
            'deTaiTen' => $this->deTai->ten_de_tai,
            'adminHoTen' => $this->admin->ho_ten,
            'lyDoTuChoi' => $this->reason,
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
            // 'broadcast_event_name' => $this->broadcastAs(), // Optional: if needed by frontend, already in wrapper
        ];
    }
}
