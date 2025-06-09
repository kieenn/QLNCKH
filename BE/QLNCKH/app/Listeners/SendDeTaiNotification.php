<?php

namespace App\Listeners;

use App\Events\DeTaiApproved;
use App\Events\DeTaiRejected;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendDeTaiNotification
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
        $deTai = $event->deTai;
        $admin = $event->admin;
        $isApproved = $event instanceof DeTaiApproved;
        // Access the 'reason' property from DeTaiRejected event
        $rejectionReason = $isApproved ? null : ($event->reason ?? 'Không có lý do cụ thể.');

        // Find all relevant users: the registrant (msvc_gvdk) and all participants (tham_gia)
        // Ensure relationships are loaded if not already
        $deTai->loadMissing('giangVienThamGia');

        $relevantUserMsvcs = collect([$deTai->msvc_gvdk]) // Start with the registrant's MSVC
            ->merge($deTai->giangVienThamGia->pluck('msvc')) // Add participants' MSVCs
            ->unique() // Get unique MSVCs
            ->filter() // Remove any null/empty MSVCs
            ->toArray();

        if (empty($relevantUserMsvcs)) {
            Log::warning("No relevant users found (registrant or participants) for DeTai ID {$deTai->id} notification.");
            return;
        }

        // Fetch User models based on MSVCs
        $usersToNotify = User::whereIn('msvc', $relevantUserMsvcs)->get();

        if ($usersToNotify->isEmpty()) {
             Log::warning("No User models found for MSVCs: " . implode(', ', $relevantUserMsvcs) . " for DeTai ID {$deTai->id} notification.");
             return;
        }

        $notificationType = $isApproved ? 'DeTaiApproved' : 'DeTaiRejected';
        $title = $isApproved ? 'Đề tài đã được duyệt' : 'Đề tài đã bị từ chối';
        $body = $isApproved
            ? "Đề tài \"{$deTai->ten_de_tai}\" của bạn đã được duyệt."
            : "Đề tài \"{$deTai->ten_de_tai}\" của bạn đã bị từ chối.";

        // Construct the link to the DeTai detail page for the lecturer (adjust based on your frontend routing)
        $link = "/lecturer/researches/{$deTai->id}"; // Assuming the route uses the DeTai ID

        $details = [
            'deTaiId' => $deTai->id,
            'deTaiMa' => $deTai->ma_de_tai, // Include ma_de_tai if available
            'deTaiTen' => $deTai->ten_de_tai,
            'adminHoTen' => $admin->ho_ten,
        ];

        if (!$isApproved) {
            $details['lyDoTuChoi'] = $rejectionReason;
            $body .= " Lý do: " . $rejectionReason;
        }

        foreach ($usersToNotify as $user) {
             // Optional: Avoid notifying the admin who performed the action if they are also a participant/registrant.
             // This depends on desired behavior. For simplicity, we notify all relevant users.
             // if ($user->id === $admin->id) continue;

            Notification::create([
                'type' => $notificationType,
                'notifiable_type' => User::class, // Link to the User model
                'notifiable_id' => $user->id, // The ID of the User model
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
            Log::info("Notification created for user ID {$user->id} for DeTai ID {$deTai->id}. Type: {$notificationType}");
        }
    }
}