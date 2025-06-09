<?php

namespace App\Events;

use App\Models\BaiBao;
use App\Models\User; // Admin who rejected
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str; // Import Str for UUID

class BaiBaoRejected implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public BaiBao $baiBao;
    public User $admin;
    public string $reason;

    public function __construct(BaiBao $baiBao, User $admin, string $reason)
    {
        $this->baiBao = $baiBao;
        $this->admin = $admin;
        $this->reason = $reason;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('lecturer-notifications.' . $this->baiBao->msvc_nguoi_nop),
        ];
    }

    public function broadcastAs()
    {
        return 'baibao.rejected';
    }

    public function broadcastWith(): array
    {
        $notificationType = 'BaiBaoRejected';
        $title = 'Bài báo đã bị từ chối';
        $body = "Bài báo \"{$this->baiBao->ten_bai_bao}\" của bạn đã bị từ chối.";
        $body .= " Lý do: {$this->reason}.";

        $this->baiBao->loadMissing('deTai');
        $deTaiTen = $this->baiBao->deTai ? $this->baiBao->deTai->ten_de_tai : 'Không rõ';
        $body .= " Liên quan đến đề tài: \"{$deTaiTen}\".";

        $link = "/lecturer/articles/{$this->baiBao->id}";

        $details = [
            'baiBaoId' => $this->baiBao->id,
            'baiBaoTen' => $this->baiBao->ten_bai_bao,
            'deTaiId' => $this->baiBao->deTai ? $this->baiBao->deTai->id : null,
            'deTaiMa' => $this->baiBao->deTai ? $this->baiBao->deTai->ma_de_tai : null,
            'deTaiTen' => $deTaiTen,
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
        ];
    }
}
