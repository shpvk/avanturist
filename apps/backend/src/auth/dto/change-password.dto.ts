import {
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
    Validate,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'changedPasswordsMatch', async: false })
class ChangedPasswordsMatchConstraint implements ValidatorConstraintInterface {
    validate(passwordRepeat: string, args: ValidationArguments): boolean {
        const dto = args.object as ChangePasswordDto;

        return passwordRepeat === dto.password;
    }
}

export class ChangePasswordDto {
    @IsString({ message: 'Текущий пароль должен быть строкой.' })
    @IsNotEmpty({ message: 'Введите текущий пароль.' })
    @MaxLength(128, { message: 'Текущий пароль — максимум 128 символов.' })
    currentPassword!: string;

    @IsString({ message: 'Пароль должен быть строкой.' })
    @IsNotEmpty({ message: 'Введите новый пароль.' })
    @MinLength(8, { message: 'Новый пароль — минимум 8 символов.' })
    @MaxLength(128, { message: 'Новый пароль — максимум 128 символов.' })
    password!: string;

    @IsString({ message: 'Повтор пароля должен быть строкой.' })
    @IsNotEmpty({ message: 'Повторите новый пароль.' })
    @MaxLength(128, { message: 'Повтор пароля — максимум 128 символов.' })
    @Validate(ChangedPasswordsMatchConstraint, {
        message: 'Пароли не совпадают.',
    })
    passwordRepeat!: string;
}
