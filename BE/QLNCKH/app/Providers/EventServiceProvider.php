<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

// Listener hiện có cho ResearchTopicSubmitted
use App\Listeners\StoreResearchTopicNotification;

// Events bạn đã dispatch từ AdminController
use App\Events\DeTaiApproved;
use App\Events\DeTaiRejected;
use App\Events\BaiBaoApproved;
use App\Events\BaiBaoRejected;
// Event khi giảng viên nộp bài báo (nếu bạn muốn lắng nghe nó ở đây, ví dụ để thông báo cho admin)
// use App\Events\BaiBaoSubmitted;

// Listeners mới để gửi thông báo cho giảng viên
use App\Listeners\SendDeTaiNotification;
use App\Listeners\SendBaiBaoNotification;

// Event khi giảng viên nộp đề tài (đã có)
use App\Events\ResearchTopicSubmitted;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],

        // Listener hiện có của bạn khi giảng viên nộp đề tài
        // (Giả sử StoreResearchTopicNotification là để lưu thông báo cho admin hoặc một hành động khác)
        ResearchTopicSubmitted::class => [
            StoreResearchTopicNotification::class,
            // Nếu bạn muốn gửi thêm thông báo khác cho sự kiện này, bạn có thể thêm listener ở đây
        ],

        // Listeners cho các hành động của Admin đối với Đề tài (gửi thông báo cho giảng viên)
        DeTaiApproved::class => [
            SendDeTaiNotification::class,
        ],
        DeTaiRejected::class => [
            SendDeTaiNotification::class,
        ],

        // Listeners cho các hành động của Admin đối với Bài báo (gửi thông báo cho giảng viên)
        BaiBaoApproved::class => [
            SendBaiBaoNotification::class,
        ],
        BaiBaoRejected::class => [
            SendBaiBaoNotification::class,
        ],

        // Ví dụ: Nếu bạn muốn lắng nghe sự kiện khi giảng viên nộp bài báo
        // và thực hiện một hành động nào đó (ví dụ: thông báo cho admin)
        /*
        \App\Events\BaiBaoSubmitted::class => [
            // \App\Listeners\NotifyAdminAboutNewArticle::class, // Tạo listener này nếu cần
        ],*/ // End of the comment for the example listener
    ]; // This correctly closes the $listen array

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
