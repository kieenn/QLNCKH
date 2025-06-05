<?php

namespace App\Listeners;

use App\Events\BaiBaoApproved;
use App\Events\BaiBaoRejected;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendBaiBaoNotification
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $baiBao = $event->baiBao;
        $admin = $event->admin;
        $isApproved = $event instanceof BaiBaoApproved;
        // Assuming BaiBaoRejected event has a public property named $lyDoTuChoi
        $rejectionReason = $isApproved ? null : ($event->lyDoTuChoi ?? 'Không có lý do cụ thể.');

        // Find the user who submitted the BaiBao
        // Ensure the relationship is loaded if not already
        $baiBao->loadMissing('nguoiNop');
        $submitter = $baiBao->nguoiNop; // Relationship defined in BaiBao model

        if (!$submitter) {
            Log::warning("Submitter not found for BaiBao ID {$baiBao->id} notification.");
            return;
        }

        $notificationType = $isApproved ? 'BaiBaoApproved' : 'BaiBaoRejected';
        $title = $isApproved ? 'Bài báo đã được duyệt' : 'Bài báo đã bị từ chối';
        $body = $isApproved
            ? "Bài báo \"{$baiBao->ten_bai_bao}\" của bạn đã được duyệt."
            : "Bài báo \"{$baiBao->ten_bai_bao}\" của bạn đã bị từ chối.";

        // Get related DeTai info if available for context
        $baiBao->loadMissing('deTai');
        $deTaiTen = $baiBao->deTai ? $baiBao->deTai->ten_de_tai : 'Không rõ';
        $body .= " Liên quan đến đề tài: \"{$deTaiTen}\".";

        // Construct the link to the BaiBao detail page for the lecturer (adjust based on your frontend routing)
        $link = "/lecturer/articles/{$baiBao->id}"; // Assuming the route uses the BaiBao ID

        $details = [
            'baiBaoId' => $baiBao->id,
            'baiBaoTen' => $baiBao->ten_bai_bao,
            'deTaiId' => $baiBao->deTai ? $baiBao->deTai->id : null,
            'deTaiMa' => $baiBao->deTai ? $baiBao->deTai->ma_de_tai : null,
            'deTaiTen' => $deTaiTen,
            'adminHoTen' => $admin->ho_ten,
        ];

        if (!$isApproved) {
            $details['lyDoTuChoi'] = $rejectionReason;
            $body .= " Lý do: " . $rejectionReason;
        }

        Notification::create([
            'type' => $notificationType,
            'notifiable_type' => User::class, // Link to the User model
            'notifiable_id' => $submitter->id, // The ID of the submitter User model
            'data' => [ // Store relevant data as JSON
                'type' => $notificationType,
                'title' => $title,
                'body' => $body,
                'link' => $link,
                'details' => $details,
            ],
            'read_at' => null, // Initially unread
            'created_at' => now(), // Set creation timestamp
            // 'updated_at' is null as per schema/model
        ]);
        Log::info("Notification created for submitter user ID {$submitter->id} for BaiBao ID {$baiBao->id}. Type: {$notificationType}");
    }
}