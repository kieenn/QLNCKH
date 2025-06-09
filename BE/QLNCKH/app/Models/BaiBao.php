<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids; // Nếu ID bài báo là UUID

class BaiBao extends Model
{
    use HasFactory;
    // Uncomment nếu ID của bảng bai_bao là UUID và bạn muốn tự động sinh
    // use HasUuids;
    // protected $keyType = 'string';
    // public $incrementing = false;

    protected $table = 'bai_bao'; // Tên bảng trong cơ sở dữ liệu

    protected $fillable = [
        'de_tai_id', // Khóa ngoại liên kết với bảng de_tai (có thể là ma_de_tai hoặc id của de_tai)
        'ten_bai_bao',
        'ngay_xuat_ban',
        'mo_ta',
        'msvc_nguoi_nop', // MSVC của người nộp
        'trang_thai',     // Ví dụ: 'chờ duyệt', 'đã duyệt', 'từ chối'
        'admin_msvc',     // MSVC của admin xét duyệt
        'nhan_xet',       // Nhận xét của admin
        // Thêm các trường khác nếu có
    ];
        // Disable the updated_at timestamp
    const UPDATED_AT = null;
    /**
     * Các trường nên được cast sang kiểu dữ liệu gốc.
     *
     * @var array
     */
    protected $casts = [
        'ngay_xuat_ban' => 'date',
    ];

    /**
     * Mối quan hệ: Bài báo thuộc về một Đề tài.
     * Giả sử 'de_tai_id' trong bảng 'bai_bao' lưu 'ma_de_tai' của bảng 'de_tai'.
     * Nếu 'de_tai_id' lưu 'id' của bảng 'de_tai', hãy thay 'ma_de_tai' thành 'id'.
     */
    public function deTai()
    {
        // Dựa theo LecturerController, de_tai_id của bai_bao lưu ma_de_tai của de_tai
        return $this->belongsTo(DeTai::class, 'de_tai_id', 'ma_de_tai');
    }

    /**
     * Mối quan hệ: Bài báo được nộp bởi một Người dùng (Giảng viên).
     */
    public function nguoiNop()
    {
        return $this->belongsTo(User::class, 'msvc_nguoi_nop', 'msvc');
    }

    /**
     * Mối quan hệ: Bài báo được xét duyệt bởi một Người dùng (Admin).
     */
    public function adminXetDuyet()
    {
        return $this->belongsTo(User::class, 'admin_msvc', 'msvc');
    }

    /**
     * Mối quan hệ: Bài báo có nhiều Tài liệu đính kèm.
     */
    public function taiLieu()
    {
        return $this->hasMany(TaiLieu::class, 'bai_bao_id', 'id'); // Giả sử khóa chính của bai_bao là 'id'
    }
    public function baiBaos()
{
    return $this->hasMany(\App\Models\BaiBao::class, 'de_tai_id', 'ma_de_tai');
}
}