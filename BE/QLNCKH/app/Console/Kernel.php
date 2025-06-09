<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('notifications:send-deadline-reminders')->dailyAt('08:00'); // Chạy vào 8h sáng hàng ngày
        $logPath = storage_path('logs/schedule_output.log');

        // Lên lịch chạy backup hàng ngày vào lúc 01:00 sáng
        $schedule->command('backup:run')
                 ->daily()->at('01:00')
                 ->appendOutputTo($logPath);

        // Lên lịch dọn dẹp các bản backup cũ hàng ngày vào lúc 02:00 sáng
        $schedule->command('backup:clean')
                 ->daily()->at('02:00')
                 ->appendOutputTo($logPath);

        // Lên lịch giám sát "sức khỏe" của các bản backup hàng ngày vào lúc 03:00 sáng
        $schedule->command('backup:monitor')
                 ->daily()->at('03:00')
                 ->appendOutputTo($logPath);
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
