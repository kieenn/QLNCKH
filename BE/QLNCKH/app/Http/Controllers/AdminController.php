<?php
// app/Http/Controllers/AuthController.php

// Thêm DB facade
namespace App\Http\Controllers;

use App\Events\BaiBaoApproved;
use App\Events\BaiBaoRejected;
use App\Events\DeTaiApproved;
use Illuminate\Support\Facades\DB; 
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Models\User; // Import the User model
use App\Models\Permission; // Import the UserPermission model (adjust namespace if needed)
// OR if you prefer the DB facade:
// use Illuminate\Support\Facades\DB;
use App\Models\HocHam;
use App\Models\HocVi;
use App\Models\DonVi;
use Illuminate\Validation\Rules\Password; // Thêm Password rule
use Illuminate\Support\Facades\Log;
use App\Models\CapNhiemVu; // Import the CapNhiemVu model (adjust namespace if needed)
use App\Models\LinhVucNghienCuu; // Import the LinhVucNghienCuu model (adjust namespace if needed)
use App\Models\DeTai; // Import the DeTai model (adjust namespace if needed)
use App\Models\DeTaiTienDo;
use App\Models\ThamGia;
use App\Models\TrangThaiDeTai;
use App\Models\VaiTro;
use App\Models\TienDo;
use App\Models\Notification;
use App\Models\BaiBao;
use App\Models\TaiLieu;
use App\Models\AdminLog; // Thêm model AdminLog
use Illuminate\Database\Eloquent\Model; // Thêm để type hint Model
use Illuminate\Support\Str; // Thêm để lấy tên class ngắn gọn
use App\Events\DeTaiRejected;
class AdminController extends Controller
{
    /**
     * Handle an incoming authentication request using MSVC for Admin access.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Validation\ValidationException
     */

    /**
     * Ghi lại hành động của admin.
     *
     * @param string $hanhDong Mô tả hành động (ví dụ: "Thêm người dùng", "Cập nhật đơn vị").
     * @param Request $request Request hiện tại để lấy IP.
     * @param Model|null $modelInstance Instance của model bị tác động (User, DonVi, DeTai, etc.).
     * @param array|null $noiDungTruoc Dữ liệu của đối tượng TRƯỚC khi thay đổi (cho update, delete).
     * @param array|null $noiDungSau Dữ liệu của đối tượng SAU khi thay đổi (cho create, update).
     * @param string|null $doiTuongIdOverride ID của đối tượng nếu modelInstance là null (ví dụ sau khi delete).
     * @param string|null $doiTuongNameOverride Tên đối tượng nếu modelInstance là null hoặc muốn ghi đè.
     * @return void
     */
    protected function logAdminAction(
        string $hanhDong,
        Request $request,
        Model $modelInstance = null,
        array $noiDungTruoc = null,
        array $noiDungSau = null,
        string $doiTuongIdOverride = null,
        string $doiTuongNameOverride = null
    ) {
        /** @var \App\Models\User $admin */
        $admin = Auth::user();
        if (!$admin) {
            return; // Không nên xảy ra trong admin controller đã được xác thực
        }

        $doiTuongName = $doiTuongNameOverride;
        if (!$doiTuongName && $modelInstance) {
            $doiTuongName = Str::afterLast(get_class($modelInstance), '\\'); // Ví dụ: "User" từ "App\Models\User"
        }

        $doiTuongId = $doiTuongIdOverride ?? ($modelInstance ? (string)$modelInstance->getKey() : null);

        // Loại bỏ các trường password khỏi log để bảo mật
        unset($noiDungTruoc['password'], $noiDungTruoc['password_confirmation']);
        unset($noiDungSau['password'], $noiDungSau['password_confirmation']);

        AdminLog::create([
            'admin_id' => $admin->id,
            'hanh_dong' => $hanhDong,
            'doi_tuong' => $doiTuongName,
            'doi_tuong_id' => $doiTuongId,
            'noi_dung_truoc' => $noiDungTruoc ?: null, // Đảm bảo null nếu mảng rỗng
            'noi_dung_sau' => $noiDungSau ?: null,   // Đảm bảo null nếu mảng rỗng
            'ip_address' => $request->ip(),
        ]);
    }

     // quản lý tài khoản
    
    public function getUsers(Request $request)
    {   
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Tài Khoản')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        // Define the number of users per page
        $perPage = 16;

        // Start building the query
        $query = User::query();

        // Filter by don_vi_id if provided
        if ($request->filled('don_vi_id')) {
            $query->where('don_vi_id', $request->input('don_vi_id'));
        }

        // Search functionality if 'search' term is provided
        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('ho_ten', 'ILIKE', "%{$searchTerm}%") // Use ILIKE for case-insensitive search in PostgreSQL
                  ->orWhere('msvc', 'ILIKE', "%{$searchTerm}%")
                  ->orWhere('email', 'ILIKE', "%{$searchTerm}%");
            });
        }

        // Fetch users with pagination, eager load permissions to avoid N+1 queries
        $users = $query->with(['permissions', 'donVi']) // Eager load relationships
                     ->select('id', 'msvc', 'ho_ten', 'email', 'sdt', 'is_superadmin', 'hoc_ham_id', 'hoc_vi_id', 'don_vi_id', 'dob')
                     ->paginate($perPage);

        // Laravel's paginate method automatically structures the response for pagination
        return response()->json($users, 200);
    }
    
    public function getPermissions()
    {
        $permissions = Permission::select('id', 'ma_quyen', 'mo_ta')->get();
        return response()->json($permissions);
    }

    public function getUserPermissions(User $user)
    {
        // Lấy danh sách các mã quyền (ma_quyen)
        $permissionCodes = $user->permissions()->pluck('permissions.ma_quyen')->toArray();
        
        // Trả về is_superadmin và danh sách mã quyền
        return response()->json([
            'msvc' => $user->msvc, // Thêm msvc để dễ nhận diện user
            'is_superadmin' => (bool) $user->is_superadmin,
            'permission_codes' => $permissionCodes,
        ]);
    }

    public function getHocHam()
    {
        $hocHam = HocHam::select('id', 'ten')->get();
        return response()->json($hocHam);
    }

    public function getHocVi()
    {
        $hocVi = HocVi::select('id', 'ten')->get(); 
        return response()->json($hocVi);
    }

    public function getDonVi()
    {
        $donVi = DonVi::select('id', 'ten', 'parent_id')->get();
        return response()->json($donVi);
    }

    public function updateUser(Request $request, User $user)
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Tài Khoản')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $validatedData = $request->validate([
            'ho_ten' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'sdt' => 'nullable|string|max:20',
            'dob' => 'nullable|date_format:Y-m-d',
            'don_vi_id' => 'nullable|integer|exists:don_vi,id',
            'hoc_ham_id' => 'nullable|integer|exists:hoc_ham,id',
            'hoc_vi_id' => 'nullable|integer|exists:hoc_vi,id',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $originalData = $user->makeHidden(['password', 'password_confirmation'])->toArray(); // Lấy dữ liệu gốc trước khi cập nhật

        if (!empty($validatedData['password'])) {
            $validatedData['password'] = Hash::make($validatedData['password']);
        } else {
            unset($validatedData['password']);
        }

        $user->update($validatedData);
        $updatedData = $user->refresh()->makeHidden(['password', 'password_confirmation'])->toArray(); // Lấy dữ liệu sau khi cập nhật

        // Ghi log
        $this->logAdminAction('Cập nhật người dùng', $request, $user, $originalData, $updatedData);

        return response()->json($user->makeHidden('password'), 200);
    }    

    public function syncPermissions(Request $request, User $user)
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Tài Khoản')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $validatedData = $request->validate([
            'is_superadmin' => 'required|boolean',
            'permissions' => 'present|array',
            'permissions.*' => 'string|exists:permissions,ma_quyen',
        ]);
        
        DB::beginTransaction();
        try {
            $originalData = [
                'is_superadmin' => $user->is_superadmin,
                'permissions' => $user->permissions()->pluck('ma_quyen')->toArray()
            ];

            $user->is_superadmin = $validatedData['is_superadmin'];
            $user->save(); 

            if ($user->is_superadmin) {
                $user->permissions()->sync([]); 
            } else {
                $permissionIds = Permission::whereIn('ma_quyen', $validatedData['permissions'])->pluck('id')->toArray();
                $user->permissions()->sync($permissionIds);
            }
            
            DB::commit();

            $user->load('permissions');
            $updatedData = [
                'is_superadmin' => $user->is_superadmin,
                'permissions' => $user->permissions()->pluck('ma_quyen')->toArray()
            ];

            $this->logAdminAction(
                'Cập nhật quyền người dùng',
                $request,
                $user,
                $originalData,
                $updatedData
            );

            return response()->json([
                'message' => 'Cập nhật quyền thành công!',
                'user' => $user->only(['id', 'msvc', 'ho_ten', 'is_superadmin']),
                'permissions' => $user->permissions->pluck('ma_quyen') 
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error syncing permissions for user ID ' . $user->id . ': ' . $e->getMessage());
            return response()->json(['message' => 'Đã xảy ra lỗi khi cập nhật quyền.', 'error' => $e->getMessage()], 500);
        }
    }

    public function addUser(Request $request)
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Tài Khoản')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $validatedData = $request->validate([
            'ho_ten' => 'required|string|max:255',
            'msvc' => 'required|string|max:100|unique:users,msvc', 
            'email' => 'required|string|email|max:255|unique:users,email', 
            'sdt' => 'nullable|string|max:20',
            'dob' => 'nullable|date_format:Y-m-d',
            'don_vi_id' => 'nullable|integer|exists:don_vi,id',
            'hoc_ham_id' => 'nullable|integer|exists:hoc_ham,id',
            'hoc_vi_id' => 'nullable|integer|exists:hoc_vi,id',
            'password' => ['required', 'confirmed', Password::defaults()], 
            'is_superadmin' => 'required|boolean',
            'permissions' => 'present|array', 
            'permissions.*' => 'string|exists:permissions,ma_quyen' 
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'ho_ten' => $validatedData['ho_ten'], 
                'msvc' => $validatedData['msvc'],
                'email' => $validatedData['email'],
                'sdt' => $validatedData['sdt'],
                'dob' => $validatedData['dob'], 
                'don_vi_id' => $validatedData['don_vi_id'],
                'hoc_ham_id' => $validatedData['hoc_ham_id'],
                'hoc_vi_id' => $validatedData['hoc_vi_id'],
                'password' => Hash::make($validatedData['password']),
                'is_superadmin' => $validatedData['is_superadmin'],
            ]);

            if (!$user->is_superadmin && !empty($validatedData['permissions'])) {
                $permissionIds = Permission::whereIn('ma_quyen', $validatedData['permissions'])->pluck('id');
                $user->permissions()->sync($permissionIds);
            }

            DB::commit();

            $this->logAdminAction(
                'Thêm người dùng',
                $request,
                $user, 
                null,  
                $user->makeHidden(['password', 'password_confirmation'])->load('permissions')->toArray() 
            );

            return response()->json($user->makeHidden('password'), 201); 
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating user: ' . $e->getMessage());
            return response()->json(['message' => 'Đã xảy ra lỗi khi tạo người dùng.', 'error' => $e->getMessage()], 500);
        }
    }


    // quản lý khai báo ( đơn vị, cấp nhiệm vụ, lĩnh vực nghiên cứu)
    public function updateUnit(Request $request, DonVi $donVi)
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $validatedData = $request->validate([
            'ten' => 'required|string|max:255',
            'parent_id' => 'nullable|integer|exists:don_vi,id', 
        ]);

        $originalData = $donVi->toArray();
        $donVi->update($validatedData);
        $updatedData = $donVi->refresh()->toArray();

        $this->logAdminAction('Cập nhật đơn vị', $request, $donVi, $originalData, $updatedData);

        return response()->json($donVi, 200); 
    }
    
    public function addUnit(Request $request)
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $validatedData = $request->validate([
            'ten' => 'required|string|max:255',
            'parent_id' => 'nullable|integer|exists:don_vi,id', 
        ]);

        $donVi = DonVi::create($validatedData);
        $this->logAdminAction('Thêm đơn vị', $request, $donVi, null, $donVi->toArray());

        return response()->json($donVi, 201); 
    }
    public function deleteUnit(Request $request, DonVi $donVi) // Thêm Request $request
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $originalData = $donVi->toArray();
        $donViId = $donVi->id; 
        $donViName = Str::afterLast(get_class($donVi), '\\'); 

        $donVi->delete();

        $this->logAdminAction('Xóa đơn vị', 
            $request, 
            null, 
            $originalData, 
            null, 
            (string)$donViId, $donViName);

        return response()->json(['message' => 'Đơn vị đã được xóa thành công.'], 200); 
    }
    public function getDonViPagination(Request $request) 
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $perPage = $request->query('per_page', 15); 
        $searchTerm = $request->query('search'); 
        $parentId = $request->query('parent_id'); 

        $query = DonVi::query()
            ->from('don_vi as d') 
            ->select('d.id', 'd.ten', 'd.parent_id', 'p.ten as parent_ten') 
            ->leftJoin('don_vi as p', 'd.parent_id', '=', 'p.id'); 

        if ($searchTerm) {
            $query->where('d.ten', 'ILIKE', "%{$searchTerm}%");
        }

        if ($request->filled('parent_id')) { 
            if (strtolower($parentId) === 'null' || $parentId === '0') {
                $query->whereNull('d.parent_id'); 
            } elseif (filter_var($parentId, FILTER_VALIDATE_INT)) {
                $query->where('d.parent_id', $parentId); 
            }
        }

        $donVi = $query->paginate($perPage); 
        return response()->json($donVi);
    }

    public function getCapNhiemVu()
    {
        $capNhiemVu = CapNhiemVu::all(); 
        return response()->json($capNhiemVu);
    }

    public function getCapNhiemVuPagination(Request $request) 
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $perPage = $request->query('per_page', 15); 
        $searchTerm = $request->query('search'); 
        $parentId = $request->query('parent_id'); 

        $query = CapNhiemVu::query()
            ->from('cap_nhiem_vu as cnv') 
            ->select('cnv.id', 'cnv.ten', 'cnv.kinh_phi', 'cnv.parent_id', 'p.ten as parent_ten')
            ->leftJoin('cap_nhiem_vu as p', 'cnv.parent_id', '=', 'p.id');

        if ($searchTerm) {
            $query->where('cnv.ten', 'ILIKE', "%{$searchTerm}%");
        }

        if ($request->filled('parent_id')) { 
            if (strtolower($parentId) === 'null' || $parentId === '0') {
                $query->whereNull('cnv.parent_id');
            } elseif (filter_var($parentId, FILTER_VALIDATE_INT)) {
                $query->where('cnv.parent_id', $parentId);
            }
        }

        $capNhiemVu = $query->paginate($perPage);
        return response()->json($capNhiemVu);
    }
    public function updateCapNhiemVu(Request $request, CapNhiemVu $capNhiemVu)
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $validatedData = $request->validate([
            'ten' => 'required|string|max:255',
            'kinh_phi' => 'nullable|numeric', 
            'parent_id' => 'nullable|integer|exists:cap_nhiem_vu,id', 
        ]);

        $originalData = $capNhiemVu->toArray();
        $capNhiemVu->update($validatedData);
        $updatedData = $capNhiemVu->refresh()->toArray();

        $this->logAdminAction('Cập nhật cấp nhiệm vụ', $request, $capNhiemVu, $originalData, $updatedData);
        return response()->json($capNhiemVu, 200); 
    }
    public function addCapNhiemVu(Request $request)
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $validatedData = $request->validate([
            'ten' => 'required|string|max:255',
            'kinh_phi' => 'nullable|numeric', 
            'parent_id' => 'nullable|integer|exists:cap_nhiem_vu,id', 
        ]);

        $capNhiemVu = CapNhiemVu::create($validatedData);
        $this->logAdminAction('Thêm cấp nhiệm vụ', $request, $capNhiemVu, null, $capNhiemVu->toArray());

        return response()->json($capNhiemVu, 201); 
    }

    public function deleteCapNhiemVu(Request $request, CapNhiemVu $capNhiemVu) // Thêm Request $request
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $originalData = $capNhiemVu->toArray();
        $capNhiemVuId = $capNhiemVu->id;
        $capNhiemVuName = Str::afterLast(get_class($capNhiemVu), '\\');

        $capNhiemVu->delete();

        $this->logAdminAction('Xóa cấp nhiệm vụ', 
            $request, 
            null, 
            $originalData, 
            null, 
            (string)$capNhiemVuId, $capNhiemVuName);

        return response()->json(['message' => 'Cấp nhiệm vụ đã được xóa thành công.'], 200); 
    }

    public function getLinhVucNghienCuuPagination(Request $request) 
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $perPage = $request->query('per_page', 15); 
        $searchTerm = $request->query('search'); 

        $query = LinhVucNghienCuu::query()
            ->select('id', 'ten');

        if ($searchTerm) {
            $query->where('ten', 'ILIKE', "%{$searchTerm}%");
        }

        $linhVucCN = $query->paginate($perPage);
        return response()->json($linhVucCN);
    }

    public function updateLinhVucNghienCuu(Request $request, LinhVucNghienCuu $linhVucNghienCuu) 
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $validatedData = $request->validate([
            'ten' => 'required|string|max:100'
        ]);
        
        $originalData = $linhVucNghienCuu->toArray();
        $updateResult = $linhVucNghienCuu->update($validatedData); 
        
        $linhVucNghienCuu->refresh(); 
        $updatedData = $linhVucNghienCuu->toArray();

        if ($updateResult) {
            $this->logAdminAction('Cập nhật lĩnh vực nghiên cứu', $request, $linhVucNghienCuu, $originalData, $updatedData);
        } else {
            Log::warning('Update LinhVucNghienCuu ID: ' . $linhVucNghienCuu->id . ' failed or no changes made.');
        }
        
        return response()->json($linhVucNghienCuu, 200); 
    }
    public function addLinhVucNghienCuu(Request $request)
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $validatedData = $request->validate([
            'ten' => 'required|string|max:255',
        ]);
        $linhVucCN = LinhVucNghienCuu::create($validatedData);
        $this->logAdminAction('Thêm lĩnh vực nghiên cứu', $request, $linhVucCN, null, $linhVucCN->toArray());
        return response()->json($linhVucCN, 201);
    }

    public function deleteLinhVucNghienCuu(Request $request, LinhVucNghienCuu $linhVucNghienCuu) // Thêm Request $request
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Khai Báo')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $originalData = $linhVucNghienCuu->toArray();
        $linhVucId = $linhVucNghienCuu->id;
        $linhVucName = Str::afterLast(get_class($linhVucNghienCuu), '\\');

        $linhVucNghienCuu->delete(); 

        $this->logAdminAction('Xóa lĩnh vực nghiên cứu', 
            $request, 
            null, 
            $originalData, 
            null, 
            (string)$linhVucId, $linhVucName);

        return response()->json(['message' => 'Lĩnh vực nghiên cứu đã được xóa thành công.'], 200); 
    }

    // quản lý đề tài 
    public function getAllLinhVucNghienCuu()
    {
        $linhVuc = LinhVucNghienCuu::select('id', 'ten')->orderBy('ten')->get();
        return response()->json($linhVuc);
    }

    public function getAllTrangThaiDeTai()
    {
        $trangThai = TrangThaiDeTai::select('id', 'ten_hien_thi')->get();
        return response()->json($trangThai);
    }

    public function getAllTienDo()
    {
        $tienDo = TienDo::select('id', 'ten_moc')->orderBy('thu_tu')->get();
        return response()->json($tienDo);
    }

    public function getListTienDoDetaiPagination(Request $request){
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Tiến Độ Đề Tài')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $perPage = 16; 

        $query = DeTai::query()->with([
            'trangThai:id,ten_hien_thi', 
            'admin:id,ho_ten',          
            'linhVucNghienCuu:id,ten', 
            'capNhiemVu:id,ten',       
            'chuTri:id,ten',           
            'chuQuan:id,ten',          
            'tienDo', 
            'giangVienThamGia' => function ($query) { 
                $query->select('users.id', 'users.ho_ten', 'users.msvc') 
                      ->withPivot('vai_tro_id', 'can_edit', 'join_at'); 
            },
        ])
        ->where('de_tai.trang_thai_id', '!=', 1);

        if ($request->filled('search_keyword')) {
            $keyword = $request->input('search_keyword');
            $query->where(function ($q) use ($keyword) {
                $q->where('ten_de_tai', 'ILIKE', "%{$keyword}%")
                  ->orWhere('ma_de_tai', 'ILIKE', "%{$keyword}%");
            });
        }

        if ($request->filled('trang_thai_id')) {
            $query->where('de_tai.trang_thai_id', $request->input('trang_thai_id'));
        }

        if ($request->filled('lvnc_id')) {
            $query->where('lvnc_id', $request->input('lvnc_id'));
        }

        if ($request->filled('cnv_id')) {
            $query->where('cnv_id', $request->input('cnv_id'));
        }

        if ($request->filled('tien_do_id')) {
            $tienDoId = $request->input('tien_do_id');
            $query->whereHas('tienDo', function ($q) use ($tienDoId) {
                $q->where('tien_do.id', $tienDoId); 
            });
        }

        if ($request->filled('chu_tri_id')) {
            $query->where('chu_tri_id', $request->input('chu_tri_id'));
        }
        if ($request->filled('chu_quan_id')) {
            $query->where('chu_quan_id', $request->input('chu_quan_id'));
        }

        if ($request->filled('chu_nhiem_keyword')) {
            $cnKeyword = $request->input('chu_nhiem_keyword');
            $query->whereHas('giangVienThamGia', function ($q) use ($cnKeyword) {
                $q->where('tham_gia.vai_tro_id', 1) 
                  ->where(function ($userQuery) use ($cnKeyword) {
                      $userQuery->where('users.ho_ten', 'ILIKE', "%{$cnKeyword}%")
                                ->orWhere('users.msvc', 'ILIKE', "%{$cnKeyword}%");
                  });
            });
        }
        
        $detai = $query->paginate($perPage);

        $vaiTroIds = $detai->pluck('giangVienThamGia.*.pivot.vai_tro_id') 
                          ->flatten() 
                          ->unique() 
                          ->filter(); 

        $vaiTroMap = VaiTro::whereIn('id', $vaiTroIds)->pluck('ten_vai_tro', 'id');

        $detai->getCollection()->transform(function ($item) use ($vaiTroMap) {
            $item->giangVienThamGia->each(function ($gv) use ($vaiTroMap) {
                $gv->pivot->ten_vai_tro = $vaiTroMap[$gv->pivot->vai_tro_id] ?? 'Không xác định';
                $gv->is_chu_nhiem = ($gv->pivot->vai_tro_id == 1);
            });
            return $item;
        });
        
        return response()->json($detai);
    }


    public function updateTienDoDeTai(Request $request, DeTai $deTai)
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản Lý Tiến Độ Đề Tài')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        $validatedData = $request->validate([
            'tien_do_id' => 'required|integer|exists:tien_do,id', 
            'mo_ta' => 'nullable|string|max:1000', 
        ]);

        DB::beginTransaction();
        try {
            $originalDeTaiData = $deTai->only(['trang_thai_id']); 
            $currentTienDo = $deTai->tienDo()->wherePivot('is_present', true)->first();
            $originalTienDoData = $currentTienDo ? ['tien_do_id' => $currentTienDo->id, 'mo_ta' => $currentTienDo->pivot->mo_ta] : null;

            DeTaiTienDo::where('de_tai_id', $deTai->ma_de_tai)
                       ->update(['is_present' => false]);

            $deTai->tienDo()->attach($validatedData['tien_do_id'], [
                'mo_ta' => $validatedData['mo_ta'] ?? null, 
                'is_present' => true, 
            ]);

            if ($validatedData['tien_do_id'] == 7) { // ID 7 là "Đã nghiệm thu"
                $deTai->trang_thai_id = 3; // ID 3 là "Đã hoàn thành"
                $deTai->save();
            }

            DB::commit();

            $updatedDeTaiData = $deTai->fresh()->only(['trang_thai_id']);
            $newTienDoData = ['tien_do_id' => $validatedData['tien_do_id'], 'mo_ta' => $validatedData['mo_ta']];

            $this->logAdminAction(
                'Cập nhật tiến độ đề tài',
                $request,
                $deTai,
                ['de_tai' => $originalDeTaiData, 'tien_do_truoc' => $originalTienDoData],
                ['de_tai' => $updatedDeTaiData, 'tien_do_moi' => $newTienDoData]
            );
            
            return response()->json(['message' => 'Cập nhật tiến độ đề tài thành công.'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating DeTai progress: ' . $e->getMessage()); 
            return response()->json(['message' => 'Đã xảy ra lỗi khi cập nhật tiến độ.', 'error' => $e->getMessage()], 500);
        }
    }
        
public function getNotifications(Request $request)
{
    $user = $request->user(); 
    $notifications = Notification::where('notifiable_id', $user->id)
                                ->where('notifiable_type', User::class)
                                ->orderBy('created_at', 'desc')
                                ->take(10) 
                                ->get();
    $unreadCount = Notification::where('notifiable_id', $user->id)
                               ->where('notifiable_type', User::class)
                               ->whereNull('read_at')
                               ->count();

    return response()->json([
        'notifications' => $notifications,
        'unread_count' => $unreadCount,
    ]);
}


public function markAsRead(Request $request, $notificationId)
{
    $user = $request->user();
    $notification = Notification::where('id', $notificationId)
                                ->where('notifiable_id', $user->id)
                                ->where('notifiable_type', User::class)
                                ->first();
    if ($notification && is_null($notification->read_at)) {
        // Ghi log trước khi thay đổi (đơn giản)
        // $this->logAdminAction('Đánh dấu thông báo đã đọc', $request, $notification);
        // Hoặc chi tiết hơn:
        $originalData = ['read_at' => $notification->read_at];
        $notification->read_at = now();
        $notification->save();
        $updatedData = ['read_at' => $notification->read_at];
        $this->logAdminAction('Đánh dấu thông báo đã đọc', $request, $notification, $originalData, $updatedData);

        return response()->json(['message' => 'Notification marked as read.']);
    }
    return response()->json(['message' => 'Notification not found or already read.'], 404);
}
 
public function getListDeTaiXetDuyet(Request $request){
    /** @var \App\Models\User $currentUser */
    $currentUser = Auth::user();
    if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Duyệt Đề Tài')->exists()) {
        return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
    }

    $perPage = $request->input('per_page', 15); 

    $query = DeTai::query()
        ->where('trang_thai_id', 1) 
        ->with([ 
            'linhVucNghienCuu:id,ten',
            'capNhiemVu:id,ten',
            'chuTri:id,ten',
            'chuQuan:id,ten',
            'msvcGvdkUser:id,ho_ten,msvc', 
            'giangVienThamGia' => function ($q) { 
                $q->select('users.id', 'users.ho_ten', 'users.msvc')
                  ->withPivot('vai_tro_id'); 
            }
        ])
        ->when($request->filled('search_keyword'), function ($query) use ($request) {
            $keyword = $request->input('search_keyword');
            $query->where(function ($q) use ($keyword) {
                $q->where('ten_de_tai', 'ILIKE', "%{$keyword}%")
                  ->orWhereHas('msvcGvdkUser', function ($userQuery) use ($keyword) {
                      $userQuery->where('ho_ten', 'ILIKE', "%{$keyword}%")
                                ->orWhere('msvc', 'ILIKE', "%{$keyword}%"); 
                  });
            });
        })
        ->orderBy('created_at', 'desc'); 

    $deTaiPaginated = $query->paginate($perPage);
    return response()->json($deTaiPaginated);
}

public function getVaiTro(){
    $vaiTro = VaiTro::select('id', 'ten_vai_tro')->get();
    return response()->json($vaiTro);
}

public function setDeTai(Request $request, DeTai $deTai){
    /** @var \App\Models\User $currentUser */
    $currentUser = Auth::user();
    if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Duyệt Đề Tài')->exists()) {
        return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
    }

    if ($deTai->trang_thai_id != 1) {
        return response()->json(['message' => 'Đề tài này không ở trạng thái chờ duyệt.'], 400);
    }

    $validatedData = $request->validate([
        'trang_thai_id' => 'required|integer|exists:trang_thai_de_tai,id',
        'ma_de_tai' => 'nullable|string|max:50|unique:de_tai,ma_de_tai,' . $deTai->id, 
        'ghi_chu_xet_duyet' => 'nullable|string|max:1000', 
        'ly_do_tu_choi' => 'required_if:trang_thai_id,4|nullable|string|max:1000', 
    ]);

    DB::beginTransaction();
    try {
        $originalData = $deTai->only(['trang_thai_id', 'ma_de_tai', 'nhan_xet', 'admin_id']);
        $actionMessage = 'Xét duyệt đề tài'; // Default message

        $deTai->trang_thai_id = $validatedData['trang_thai_id'];
        $deTai->admin_id = $currentUser->id; 
        $deTai->thoi_gian_xet_duyet = now(); 
        $deTai->nhan_xet = $validatedData['ghi_chu_xet_duyet'] ?? $validatedData['ly_do_tu_choi'] ?? null; 

        if ($validatedData['trang_thai_id'] == 2) { // Đã duyệt
            if (!empty($validatedData['ma_de_tai'])) {
                $deTai->ma_de_tai = $validatedData['ma_de_tai'];
            }
            if (!$deTai->tienDo()->where('tien_do.id', 1)->exists()) {
                $deTai->tienDo()->attach(1, [ 
                    'is_present' => true, 
                ]);
            }
            $actionMessage = 'Duyệt đề tài';
            event(new DeTaiApproved($deTai, $currentUser));
        } elseif ($validatedData['trang_thai_id'] == 4) { // Từ chối
            $deTai->nhan_xet = $validatedData['ly_do_tu_choi']; // Chỉ lưu lý do từ chối
            $actionMessage = 'Từ chối đề tài';
            event(new DeTaiRejected($deTai, $currentUser, $validatedData['ly_do_tu_choi']));
        }

        $deTai->save();
        DB::commit();

        $updatedData = $deTai->fresh()->only(['trang_thai_id', 'ma_de_tai', 'nhan_xet', 'admin_id']);
        $this->logAdminAction(
            $actionMessage,
            $request,
            $deTai,
            $originalData,
            $updatedData
        );

        return response()->json(['message' => 'Xét duyệt đề tài thành công.', 'de_tai' => $deTai->fresh()], 200);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Lỗi khi xét duyệt đề tài ID ' . $deTai->id . ': ' . $e->getMessage());
        return response()->json(['message' => 'Đã xảy ra lỗi khi xét duyệt đề tài.', 'error' => $e->getMessage()], 500);
    }
}
        public function getAllBaiBao(Request $request){
        $perPage = $request->input('per_page', 15); 
        $query = BaiBao::query();

        if ($request->filled('search_keyword')) {
            $searchTerm = $request->input('search_keyword');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('bai_bao.ten_bai_bao', 'ILIKE', "%{$searchTerm}%");
                $q->orWhereHas('deTai', function ($deTaiQuery) use ($searchTerm) {
                    $deTaiQuery->where('de_tai.ten_de_tai', 'ILIKE', "%{$searchTerm}%")
                               ->orWhere('de_tai.ma_de_tai', 'ILIKE', "%{$searchTerm}%");
                });
                $q->orWhereHas('nguoiNop', function ($userQuery) use ($searchTerm) {
                     $userQuery->where('users.ho_ten', 'ILIKE', "%{$searchTerm}%")
                               ->orWhere('users.msvc', 'ILIKE', "%{$searchTerm}%");
                });
            });
        }

        if ($request->filled('trang_thai')) {
            $query->where('bai_bao.trang_thai', $request->input('trang_thai'));
        }

        if ($request->filled('de_tai_trang_thai_id')) {
            $query->whereHas('deTai', function ($q) use ($request) {
                $q->where('de_tai.trang_thai_id', $request->input('de_tai_trang_thai_id'));
            });
        }

        $query->with([
            'deTai' => function ($q) {
            $q->select(
                'de_tai.ma_de_tai',      
                'de_tai.ten_de_tai',
                'de_tai.trang_thai_id',  
                'de_tai.msvc_gvdk',      
                'de_tai.lvnc_id',        
                'de_tai.cnv_id',         
                'de_tai.ngay_bat_dau_dukien',
                'de_tai.ngay_ket_thuc_dukien'
            )
            ->with([
                'trangThai:id,ten_hien_thi',          
                'msvcGvdkUser:id,ho_ten,msvc',        
                'linhVucNghienCuu:id,ten',            
                'capNhiemVu:id,ten'                   
            ]);
        },
        'taiLieu' => function ($q) {
            $q->select('id', 'bai_bao_id', 'file_path', 'mo_ta', 'created_at');
        }
        , 'nguoiNop:id,ho_ten,msvc'
        , 'adminXetDuyet:id,ho_ten,msvc' // Eager load admin_xet_duyet
        ]);

        $query->orderBy('created_at', 'desc'); 
        $baiBaos = $query->paginate($perPage);
        return response()->json($baiBaos);
    }

    public function test(){
        return response()->json('test');
    }

    public function getArticleDetail(BaiBao $baiBao)
    {
        try {
            $baiBao->load(['deTai', 'taiLieu', 'nguoiNop', 'adminXetDuyet']); 

            if (!$baiBao) { 
                return response()->json(['message' => 'Không tìm thấy bài báo.'], 404);
            }

            return response()->json($baiBao, 200);
        } catch (\Exception $e) {
            Log::error('Lỗi khi lấy chi tiết bài báo: ' . $e->getMessage());
            return response()->json(['message' => 'Đã xảy ra lỗi khi lấy chi tiết bài báo.', 'error' => $e->getMessage()], 500);
        }
    }
     public function approveBaiBao(Request $request, BaiBao $baiBao){ // Thêm Request $request
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();

        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản lý sản phẩm')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        if ($baiBao->trang_thai !== 'chờ duyệt') {
            return response()->json(['message' => 'Bài báo này không ở trạng thái chờ duyệt hoặc đã được xử lý.'], 400);
        }

        DB::beginTransaction();
        try {
            $originalData = $baiBao->only(['trang_thai', 'admin_msvc', 'nhan_xet']);

            $baiBao->trang_thai = 'đã duyệt'; 
            $baiBao->admin_msvc = $currentUser->msvc; 
            $baiBao->nhan_xet = null; 
            $baiBao->save();

            DB::commit();
            
            $updatedData = $baiBao->fresh()->only(['trang_thai', 'admin_msvc', 'nhan_xet']);
            $this->logAdminAction('Duyệt bài báo', $request, $baiBao, $originalData, $updatedData);
            
            event(new BaiBaoApproved($baiBao, $currentUser));
            
            return response()->json(['message' => 'Bài báo đã được duyệt thành công.', 'bai_bao' => $baiBao->fresh()], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Lỗi khi duyệt bài báo ID ' . $baiBao->id . ': ' . $e->getMessage());
            return response()->json(['message' => 'Đã xảy ra lỗi khi duyệt bài báo.', 'error' => $e->getMessage()], 500);
        }
     }

     public function rejectBaiBao(Request $request, BaiBao $baiBao){
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();

        if (!$currentUser->is_superadmin && !$currentUser->permissions()->where('permissions.ma_quyen', 'Quản lý sản phẩm')->exists()) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này.'], 403);
        }

        if ($baiBao->trang_thai !== 'chờ duyệt') {
            return response()->json(['message' => 'Bài báo này không ở trạng thái chờ duyệt hoặc đã được xử lý.'], 400);
        }

        $validatedData = $request->validate([
            'ly_do_tu_choi' => 'required|string|max:1000', 
        ]);

        DB::beginTransaction();
        try {
            $originalData = $baiBao->only(['trang_thai', 'admin_msvc', 'nhan_xet']);

            $baiBao->trang_thai = 'từ chối'; 
            $baiBao->admin_msvc = $currentUser->msvc; 
            $baiBao->nhan_xet = $validatedData['ly_do_tu_choi']; 
            $baiBao->save();

            DB::commit();

            $updatedData = $baiBao->fresh()->only(['trang_thai', 'admin_msvc', 'nhan_xet']);
            $this->logAdminAction('Từ chối bài báo', $request, $baiBao, $originalData, $updatedData);
            
            event(new BaiBaoRejected($baiBao->fresh(), $currentUser, $validatedData['ly_do_tu_choi']));
            
            return response()->json(['message' => 'Bài báo đã được từ chối thành công.', 'bai_bao' => $baiBao->fresh()], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Lỗi khi từ chối bài báo ID ' . $baiBao->id . ': ' . $e->getMessage());
            return response()->json(['message' => 'Đã xảy ra lỗi khi từ chối bài báo.', 'error' => $e->getMessage()], 500);
        }
     }
         public function getDashboardStats(Request $request)
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        // Kiểm tra quyền nếu cần, ví dụ: chỉ superadmin mới xem được một số thống kê đặc biệt
        // if (!$currentUser->is_superadmin) {
        //     return response()->json(['message' => 'Bạn không có quyền xem thông tin này.'], 403);
        // }

        try {
            $pendingProjectsCount = DeTai::where('trang_thai_id', 1)->count(); // Giả sử 1 là 'Chờ duyệt'
            $lecturersCount = User::whereNotNull('msvc')->count(); // Đếm người dùng không phải superadmin
            $pendingArticlesCount = BaiBao::where('trang_thai', 'chờ duyệt')->count();

            $recentActivities = AdminLog::with('admin:id,ho_ten') // Lấy tên admin thực hiện
                                        ->orderBy('thoi_gian', 'desc')
                                        ->take(5) // Lấy 5 hoạt động gần nhất
                                        ->get(['id','admin_id', 'hanh_dong', 'doi_tuong', 'doi_tuong_id', 'thoi_gian']);

            return response()->json([
                'pendingProjectsCount' => $pendingProjectsCount,
                'lecturersCount' => $lecturersCount,
                'pendingArticlesCount' => $pendingArticlesCount,
                'recentActivities' => $recentActivities,
            ]);
        } catch (\Exception $e) {
            Log::error('Lỗi khi lấy số liệu dashboard: ' . $e->getMessage());
            return response()->json(['message' => 'Không thể tải số liệu dashboard.', 'error' => $e->getMessage()], 500);
        }
    }
}
